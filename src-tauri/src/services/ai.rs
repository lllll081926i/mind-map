use futures_util::{future::{AbortHandle, Abortable}, StreamExt};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc, time::{SystemTime, UNIX_EPOCH}};
use tauri::Emitter;
use tokio::sync::Mutex;

const DEFAULT_TIMEOUT: u64 = 300_000;
const MAX_TIMEOUT: u64 = 600_000;
const ALLOWED_AI_DOMAINS: &[&str] = &[
  "api.openai.com",
  "ark.cn-beijing.volces.com",
  "dashscope.aliyuncs.com",
  "api.deepseek.com",
  "api.moonshot.cn",
  "api.qwen.ai",
  "api.siliconflow.cn",
  "api.anthropic.com",
  "api.groq.com",
  "openrouter.ai",
];

#[derive(Default)]
pub struct AiRequestRegistry {
  pub abort_handles: Arc<Mutex<HashMap<String, AbortHandle>>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiProxyRequest {
  pub api: String,
  pub method: Option<String>,
  pub headers: Option<HashMap<String, String>>,
  pub data: serde_json::Value,
  pub timeout: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct AiEventPayload {
  request_id: String,
  chunk: Option<String>,
  message: Option<String>,
  status: Option<u16>,
}

fn build_error_payload(request_id: &str, message: String, status: Option<u16>) -> AiEventPayload {
  AiEventPayload {
    request_id: request_id.to_string(),
    chunk: None,
    message: Some(message),
    status,
  }
}

fn extract_error_message(body: &str, fallback: &str) -> String {
  serde_json::from_str::<serde_json::Value>(body)
    .ok()
    .and_then(|value| {
      value
        .get("msg")
        .and_then(|item| item.as_str())
        .or_else(|| value.get("message").and_then(|item| item.as_str()))
        .or_else(|| {
          value
            .get("error")
            .and_then(|item| item.get("message"))
            .and_then(|item| item.as_str())
        })
        .map(|value| value.to_string())
    })
    .or_else(|| {
      let trimmed = body.trim();
      if trimmed.is_empty() {
        None
      } else {
        Some(trimmed.to_string())
      }
    })
    .unwrap_or_else(|| fallback.to_string())
}

fn background_result_to_error_payload(
  request_id: &str,
  result: Result<Result<(), String>, futures_util::future::Aborted>,
) -> Option<AiEventPayload> {
  match result {
    Ok(Ok(())) => None,
    Ok(Err(message)) => Some(build_error_payload(request_id, message, None)),
    Err(_) => None,
  }
}

fn now_millis() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|duration| duration.as_millis() as u64)
    .unwrap_or(0)
}

pub async fn stop_proxy_request(registry: &AiRequestRegistry, request_id: &str) -> Result<(), String> {
  let mut guard = registry.abort_handles.lock().await;
  if let Some(handle) = guard.remove(request_id) {
    handle.abort();
  }
  Ok(())
}

pub async fn start_proxy_request(
  app: tauri::AppHandle,
  registry: &AiRequestRegistry,
  request_id: String,
  request: AiProxyRequest,
) -> Result<(), String> {
  stop_proxy_request(registry, &request_id).await?;

  let (abort_handle, abort_registration) = AbortHandle::new_pair();
  registry
    .abort_handles
    .lock()
    .await
    .insert(request_id.clone(), abort_handle);

  let registry_ref = registry.abort_handles.clone();
  let app_handle = app.clone();
  let request_id_for_emit = request_id.clone();
  tauri::async_runtime::spawn(async move {
    let request_id_for_task = request_id.clone();
    let app_handle_for_error = app_handle.clone();
    let future = async move {
      let timeout_ms = std::cmp::min(
        request.timeout.unwrap_or(DEFAULT_TIMEOUT),
        MAX_TIMEOUT,
      );
      let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_millis(timeout_ms))
        .build()
        .map_err(|error| error.to_string())?;

      let method_str = request.method.as_deref().unwrap_or("POST");
      if method_str != "POST" {
        return Err("仅支持 POST 方法".into());
      }
      let method = method_str
        .parse::<reqwest::Method>()
        .map_err(|error| error.to_string())?;

      let url = reqwest::Url::parse(&request.api)
        .map_err(|e| format!("无效的 URL: {}", e))?;
      if url.scheme() != "https" {
        return Err("仅支持 HTTPS 协议".into());
      }
      let host = url.host_str().unwrap_or("");
      let is_allowed = ALLOWED_AI_DOMAINS.iter().any(|domain| {
        host == *domain || host.ends_with(&format!(".{}", domain))
      });
      if !is_allowed {
        return Err("不支持的 API 域名".into());
      }

      let safe_headers: HashMap<String, String> = request
        .headers
        .unwrap_or_default()
        .into_iter()
        .filter(|(k, _)| {
          let kl = k.to_lowercase();
          kl == "content-type"
            || kl == "authorization"
            || kl == "x-api-key"
            || kl.starts_with("x-")
        })
        .collect();

      let mut req_builder = client.request(method, url);
      for (key, value) in &safe_headers {
        req_builder = req_builder.header(key, value);
      }
      let response = req_builder
        .json(&request.data)
        .send()
        .await
        .map_err(|error| error.to_string())?;

      if !response.status().is_success() {
        let status = response.status().as_u16();
        let body = response.text().await.unwrap_or_default();
        let message = extract_error_message(&body, "请求失败");
        let _ = app_handle.emit(
          "ai-proxy://error",
          build_error_payload(&request_id_for_task, message, Some(status)),
        );
        return Ok::<(), String>(());
      }

      let mut stream = response.bytes_stream();
      while let Some(next) = stream.next().await {
        let bytes = next.map_err(|error| error.to_string())?;
        let chunk = String::from_utf8_lossy(&bytes).to_string();
        let _ = app_handle.emit(
          "ai-proxy://chunk",
          AiEventPayload {
            request_id: request_id_for_task.clone(),
            chunk: Some(chunk),
            message: None,
            status: None,
          },
        );
      }

      let _ = app_handle.emit(
        "ai-proxy://done",
        AiEventPayload {
          request_id: request_id_for_task,
          chunk: None,
          message: None,
          status: Some(200),
        },
      );

      Ok(())
    };

    let result = Abortable::new(future, abort_registration).await;
    if let Some(payload) = background_result_to_error_payload(&request_id, result) {
      let _ = app_handle_for_error.emit("ai-proxy://error", payload);
    }
    registry_ref.lock().await.remove(&request_id);
  });

  let _ = app.emit(
    "ai-proxy://state",
    AiEventPayload {
      request_id: request_id_for_emit,
      chunk: None,
      message: Some(format!("started:{}", now_millis())),
      status: Some(102),
    },
  );

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use futures_util::future::Aborted;

  #[test]
  fn should_build_error_payload_for_background_request_error() {
    let payload = background_result_to_error_payload(
      "req-1",
      Ok::<Result<(), String>, Aborted>(Err("network failed".into())),
    )
    .expect("payload should exist");

    assert_eq!(payload.request_id, "req-1");
    assert_eq!(payload.message.as_deref(), Some("network failed"));
    assert_eq!(payload.status, None);
  }

  #[test]
  fn should_ignore_abort_background_result() {
    let payload =
      background_result_to_error_payload("req-2", Err(Aborted));

    assert!(payload.is_none());
  }

  #[test]
  fn should_extract_message_from_json_error_body() {
    let message = extract_error_message(
      r#"{"error":{"message":"invalid api key"}}"#,
      "请求失败",
    );

    assert_eq!(message, "invalid api key");
  }
}

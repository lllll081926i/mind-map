<template>
  <el-dialog
    class="aiConfigDialog"
    :class="{ isDark: isDark }"
    :title="$t('ai.AIConfiguration')"
    :visible.sync="aiConfigDialogVisible"
    width="550px"
    append-to-body
  >
    <div class="aiConfigBox">
      <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleFormRef"
        label-width="100px"
      >
        <p class="title">{{ $t('ai.providerConfiguration') }}</p>
        <p class="desc">{{ $t('ai.configTip') }}</p>
        <el-form-item :label="$t('ai.provider')" prop="provider">
          <el-select v-model="ruleForm.provider" @change="handleProviderChange">
            <el-option
              v-for="item in providerOptions"
              :key="item.value"
              :label="$t(item.labelKey)"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('ai.baseUrl')" prop="baseUrl">
          <el-input v-model="ruleForm.baseUrl"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ai.apiPath')" prop="apiPath">
          <el-input v-model="ruleForm.apiPath"></el-input>
        </el-form-item>
        <el-form-item label="API Key" prop="key">
          <el-input v-model="ruleForm.key"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ai.modelName')" prop="model">
          <el-input v-model="ruleForm.model"></el-input>
        </el-form-item>
        <p class="title">{{ $t('ai.mindMappingClientConfiguration') }}</p>
        <el-form-item :label="$t('ai.port')" prop="port">
          <el-input v-model="ruleForm.port"></el-input>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="cancel">{{ $t('ai.cancel') }}</el-button>
      <el-button type="primary" @click="confirm">{{
        $t('ai.confirm')
      }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import {
  AI_PROVIDER_LIST,
  getAiProviderMeta,
  normalizeAiConfig
} from '@/utils/aiProviders.mjs'

export default {
  model: {
    prop: 'visible',
    event: 'change'
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      aiConfigDialogVisible: false,
      ruleForm: {
        provider: '',
        protocol: '',
        baseUrl: '',
        apiPath: '',
        api: '',
        key: '',
        model: '',
        port: '',
        method: ''
      },
      rules: {
        provider: [
          {
            required: true,
            message: this.$t('ai.providerValidateTip'),
            trigger: 'change'
          }
        ],
        baseUrl: [
          {
            required: true,
            message: this.$t('ai.baseUrlValidateTip'),
            trigger: 'blur'
          }
        ],
        apiPath: [
          {
            required: true,
            message: this.$t('ai.apiPathValidateTip'),
            trigger: 'blur'
          }
        ],
        key: [
          {
            required: true,
            message: this.$t('ai.keyValidateTip'),
            trigger: 'blur'
          }
        ],
        model: [
          {
            required: true,
            message: this.$t('ai.modelValidateTip'),
            trigger: 'blur'
          }
        ],
        port: [
          {
            required: true,
            message: this.$t('ai.portValidateTip'),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    ...mapState({
      aiConfig: state => state.aiConfig,
      isDark: state => state.localConfig.isDark
    }),
    providerOptions() {
      return AI_PROVIDER_LIST
    }
  },
  watch: {
    visible(val) {
      this.aiConfigDialogVisible = val
      if (val) {
        this.initFormData()
      }
    },
    aiConfigDialogVisible(val, oldVal) {
      if (!val && oldVal) {
        this.close()
      }
    }
  },
  created() {
    this.initFormData()
  },
  methods: {
    ...mapMutations(['setLocalConfig']),

    close() {
      this.$emit('change', false)
    },

    initFormData() {
      const config = normalizeAiConfig(this.aiConfig)
      Object.keys(this.ruleForm).forEach(key => {
        this.ruleForm[key] = config[key]
      })
    },

    handleProviderChange(provider) {
      const meta = getAiProviderMeta(provider)
      const nextConfig = normalizeAiConfig({
        ...this.ruleForm,
        provider: meta.value,
        protocol: meta.protocol,
        baseUrl: meta.defaultBaseUrl,
        apiPath: meta.defaultApiPath,
        method: meta.defaultMethod
      })
      Object.keys(this.ruleForm).forEach(key => {
        this.ruleForm[key] = nextConfig[key]
      })
    },

    cancel() {
      this.close()
      this.initFormData()
    },

    confirm() {
      this.$refs.ruleFormRef.validate(valid => {
        if (valid) {
          this.close()
          this.setLocalConfig(normalizeAiConfig(this.ruleForm))
          this.$message.success(this.$t('ai.configSaveSuccessTip'))
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.aiConfigDialog {
  &.isDark {
    .aiConfigBox {
      color: hsla(0, 0%, 100%, 0.85);

      .desc {
        border-left-color: hsla(0, 0%, 100%, 0.2);
      }
    }
  }

  /deep/ .el-dialog__body {
    padding: 12px 20px;
  }

  .aiConfigBox {
    color: #303133;

    a {
      color: #409eff;
    }

    .title {
      margin-bottom: 12px;
      font-weight: bold;
    }

    .desc {
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 5px solid #ccc;
    }
  }

  /deep/ .el-form-item__label {
    color: inherit;
  }

  /deep/ .el-input__inner {
    color: inherit;
  }
}
</style>

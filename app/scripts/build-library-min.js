const fs = require('fs')
const path = require('path')
const esbuild = require('esbuild')

const distDir = path.resolve(__dirname, '../../simple-mind-map/dist')

const minifyFile = async (inputName, outputName) => {
  const source = path.resolve(distDir, inputName)
  const target = path.resolve(distDir, outputName)
  const code = fs.readFileSync(source, 'utf-8')
  const result = await esbuild.transform(code, {
    minify: true,
    legalComments: 'none'
  })

  fs.writeFileSync(target, result.code)
}

const run = async () => {
  await minifyFile('simpleMindMap.umd.js', 'simpleMindMap.umd.min.js')
  await minifyFile('simpleMindMap.esm.js', 'simpleMindMap.esm.min.js')
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})

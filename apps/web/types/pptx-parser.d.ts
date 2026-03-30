declare module 'pptx-parser' {
  function parse(buffer: Buffer): Promise<Array<{ text?: string; texts?: string[] }>>
  export default parse
}

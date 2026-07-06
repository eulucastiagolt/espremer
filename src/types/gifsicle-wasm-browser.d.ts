declare module 'gifsicle-wasm-browser' {
  interface GifsicleInputFile {
    name: string;
    file: File | Blob | ArrayBuffer | string;
  }

  interface GifsicleRunOptions {
    input: GifsicleInputFile[];
    command: string[];
  }

  interface GifsicleModule {
    run(options: GifsicleRunOptions): Promise<File[]>;
  }

  const gifsicle: GifsicleModule;
  export default gifsicle;
}

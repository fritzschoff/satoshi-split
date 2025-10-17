declare module 'process/browser' {
  const process: NodeJS.Process;
  export default process;
}

declare module 'stream-browserify' {
  import { Stream } from 'stream';
  export = Stream;
}

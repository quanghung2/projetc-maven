export class MyUploadAdapter {
  public loader: any;
  public url: string;
  public xhr: XMLHttpRequest;
  public token: string;

  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return new Promise((resolve, reject) => {
      this.loader.file.then(file => {});
    });
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  _sendRequest(file) {
    const data = new FormData();

    // change "attachments" key
    data.append('attachments', file);

    this.xhr.send(data);
  }
}

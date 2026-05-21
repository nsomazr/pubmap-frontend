/** Load CKEditor 5 classic build from CDN (manuscript sections). */

const CLASSIC_SRC = "https://cdn.ckeditor.com/ckeditor5/41.4.2/classic/ckeditor.js";

let classicLoad: Promise<void> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      const wait = () => (window.ClassicEditor ? resolve() : setTimeout(wait, 50));
      wait();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function loadCkEditor(): Promise<void> {
  if (window.ClassicEditor) return Promise.resolve();
  if (!classicLoad) {
    classicLoad = injectScript(CLASSIC_SRC).then(() => {
      if (!window.ClassicEditor) throw new Error("CKEditor failed to initialize");
    });
  }
  return classicLoad;
}

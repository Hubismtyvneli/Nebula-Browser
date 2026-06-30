import type { WebViewElement } from "@/lib/webview-registry";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<WebViewElement> & {
          src?: string;
          preload?: string;
          allowpopups?: boolean;
          disablewebsecurity?: boolean;
          partition?: string;
          httpreferrer?: string;
          useragent?: string;
          autosize?: boolean;
          minwidth?: number;
          minheight?: number;
          maxwidth?: number;
          maxheight?: number;
        },
        WebViewElement
      >;
    }
  }
}

export {};

import { useEffect } from "react";
import type { AppProps } from "next/app";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import "../lib/sentry";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    axios.defaults.baseURL = apiBase;
    axios.defaults.headers.common.Accept = "application/json";
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </>
  );
}

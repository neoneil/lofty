import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ZOOM_SDK_VERSION = "5.0.0";

function jsonScriptValue(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const meetingNumber = searchParams.get("meetingNumber")?.replace(/\s/g, "") ?? "";
  const password = searchParams.get("password") ?? "";
  const userName = searchParams.get("name")?.trim() || "Student";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zoom Classroom</title>
    <style>
      html,
      body,
      #meetingSDKElement {
        width: 100%;
        height: 100%;
        min-height: 100vh;
        margin: 0;
        overflow: hidden;
        background: #050505;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .status {
        position: fixed;
        left: 50%;
        top: 20px;
        z-index: 9999;
        max-width: min(560px, calc(100vw - 32px));
        transform: translateX(-50%);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18);
        color: #07120f;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.5;
        padding: 10px 18px;
        text-align: center;
      }

      .fallback {
        display: none;
        position: fixed;
        left: 50%;
        top: 72px;
        z-index: 9999;
        transform: translateX(-50%);
      }

      .fallback a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border-radius: 999px;
        background: #13846f;
        color: white;
        font-size: 14px;
        font-weight: 800;
        padding: 0 18px;
        text-decoration: none;
      }
    </style>
    <script src="https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/react.min.js"></script>
    <script src="https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/react-dom.min.js"></script>
    <script src="https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/redux.min.js"></script>
    <script src="https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/redux-thunk.min.js"></script>
    <script src="https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/vendor/lodash.min.js"></script>
    <script src="https://source.zoom.us/zoom-meeting-embedded-${ZOOM_SDK_VERSION}.min.js"></script>
  </head>
  <body>
    <div id="status" class="status">正在准备 Zoom 课堂...</div>
    <div id="fallback" class="fallback"><a id="fallbackLink" href="#" target="_blank" rel="noreferrer">单页打开 Zoom</a></div>
    <div id="meetingSDKElement"></div>
    <script>
      const meetingNumber = ${jsonScriptValue(meetingNumber)};
      const password = ${jsonScriptValue(password)};
      const userName = ${jsonScriptValue(userName)};

      function setStatus(message) {
        const status = document.getElementById("status");
        if (status) status.textContent = message;
      }

      function getZoomJoinUrl() {
        const params = new URLSearchParams();
        if (password.trim()) params.set("pwd", password.trim());
        const suffix = params.toString() ? "?" + params.toString() : "";
        return "https://zoom.us/j/" + meetingNumber + suffix;
      }

      function showFallback() {
        const fallback = document.getElementById("fallback");
        const fallbackLink = document.getElementById("fallbackLink");
        if (fallbackLink) fallbackLink.href = getZoomJoinUrl();
        if (fallback) fallback.style.display = "block";
      }

      function getZoomErrorMessage(error) {
        if (!error) return "";
        if (typeof error === "string") return error;
        if (error.message) return error.message;
        if (error.reason) return error.reason;
        if (error.type && error.errorCode) return error.type + " (" + error.errorCode + ")";
        if (error.type) return error.type;
        if (error.errorCode) return "Error code: " + error.errorCode;

        try {
          return JSON.stringify(error);
        } catch {
          return "";
        }
      }

      async function joinMeeting() {
        if (!meetingNumber) {
          setStatus("缺少 Meeting ID");
          showFallback();
          return;
        }

        if (!window.ZoomMtgEmbedded) {
          throw new Error("Zoom Embedded SDK CDN 加载失败");
        }

        setStatus("正在获取 Zoom signature...");

        const signatureResponse = await fetch("/api/zoom/join-classroom/signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            meetingNumber,
            role: 0
          })
        });
        const signatureData = await signatureResponse.json();

        if (!signatureResponse.ok || !signatureData.signature) {
          throw new Error(signatureData.message || "获取 Zoom signature 失败");
        }

        const meetingSDKElement = document.getElementById("meetingSDKElement");
        const client = window.ZoomMtgEmbedded.createClient();

        setStatus("正在初始化 Zoom 课堂...");

        await client.init({
          zoomAppRoot: meetingSDKElement,
          language: "en-US",
          patchJsMedia: true,
          assetPath: "https://source.zoom.us/${ZOOM_SDK_VERSION}/lib/av",
          customize: {
            video: {
              isResizable: true
            }
          }
        });

        setStatus("正在加入课堂...");

        await client.join({
          signature: signatureData.signature,
          meetingNumber,
          password,
          userName
        });

        document.getElementById("status")?.remove();
      }

      joinMeeting().catch((error) => {
        window.__loftyZoomError = error;
        console.warn("ZOOM EMBEDDED ERROR", error);
        const message = getZoomErrorMessage(error);
        setStatus(message ? "Zoom 加载失败：" + message : "Zoom 加载失败，请单页打开");
        showFallback();
      });
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

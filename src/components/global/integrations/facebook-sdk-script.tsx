import Script from "next/script";

const FACEBOOK_SDK_ID = "facebook-jssdk";
const FACEBOOK_SDK_SRC = "https://connect.facebook.net/en_US/sdk.js";

const getFacebookAppId = () =>
  process.env.NEXT_PUBLIC_WHATSAPP_APP_ID ??
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ??
  "899726042836368";

export default function FacebookSdkScript() {
  const appId = getFacebookAppId();

  if (!appId) {
    return null;
  }

  const initScript = `
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: ${JSON.stringify(appId)},
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: "v25.0"
      });
    };
  `;

  return (
    <>
      <div id="fb-root" />
      <Script
        id="facebook-jssdk-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
      <Script
        id={FACEBOOK_SDK_ID}
        src={FACEBOOK_SDK_SRC}
        strategy="afterInteractive"
        async
        defer
        crossOrigin="anonymous"
      />
    </>
  );
}

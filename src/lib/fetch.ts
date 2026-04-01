import axios from "axios";

/** Graph API version for Instagram Platform requests (keep in sync across media, messaging, etc.). */
export const INSTAGRAM_GRAPH_API_VERSION = "v21.0";
export const FACEBOOK_GRAPH_API_VERSION = "v25.0";
const FACEBOOK_GRAPH_BASE_URL =
  process.env.FACEBOOK_GRAPH_BASE_URL ?? "https://graph.facebook.com";

const getInstagramAppId = () =>
  process.env.INSTAGRAM_CLIENT_ID ?? process.env.INSTAGRAM_APP_ID;

const getInstagramAppSecret = () =>
  process.env.INSTAGRAM_CLIENT_SECRET ?? process.env.INSTAGRAM_APP_SECRET;

const getFacebookAppId = () =>
  process.env.FACEBOOK_CLIENT_ID ?? process.env.FACEBOOK_APP_ID;

const getFacebookAppSecret = () =>
  process.env.FACEBOOK_CLIENT_SECRET ?? process.env.FACEBOOK_APP_SECRET;

/** Must match exactly what you add under Meta app → Instagram → OAuth redirect URIs. */
const resolvePublicBaseUrl = () => {
  const configuredBase = (process.env.NEXT_PUBLIC_HOST_URL ?? "").trim();
  if (configuredBase) {
    return configuredBase.replace(/\/$/, "");
  }

  const vercelUrl = (process.env.VERCEL_URL ?? "").trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "";
};

export const instagramOAuthRedirectUri = () => {
  const base = resolvePublicBaseUrl();
  return `${base}/callback/instagram`;
};

export const facebookOAuthRedirectUri = () => {
  const base = resolvePublicBaseUrl();
  return `${base}/callback/facebook`;
};

const INSTAGRAM_OAUTH_SCOPES =
  "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";

const FACEBOOK_OAUTH_SCOPES =
  "pages_show_list,pages_manage_metadata,pages_read_engagement,pages_manage_engagement";

/** Authorize URL: redirect_uri always matches token exchange (generateTokens). */
export const buildInstagramAuthorizeUrl = () => {
  const redirectUri = instagramOAuthRedirectUri();

  if (!redirectUri.startsWith("http")) {
    console.log("[instagram:oauth] invalid_redirect_base", {
      NEXT_PUBLIC_HOST_URL: process.env.NEXT_PUBLIC_HOST_URL ?? null,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
    });
  }

  const params = new URLSearchParams({
    enable_fb_login: "0",
    force_reauth: "true",
    client_id: getInstagramAppId() as string,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: INSTAGRAM_OAUTH_SCOPES,
  });
  console.log("[instagram:oauth] authorize_redirect_uri", redirectUri);
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
};

export const buildFacebookAuthorizeUrl = () => {
  const params = new URLSearchParams({
    client_id: getFacebookAppId() as string,
    redirect_uri: facebookOAuthRedirectUri(),
    response_type: "code",
    scope: FACEBOOK_OAUTH_SCOPES,
  });

  return `https://www.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
};

/* 

1. Short Lived Access Token
  - Initial Token received from Instagram after authentication
  - Obtained through the OAuthflow in the `generateTokens` function
  - Validity: 1 hour
  - Exchanged for Long Lived Token

2. Long Lived Access Token
  - Validity: 60 days
  - Used to make requests to the Instagram API
  - Used for making API calls over an extended period without requiring the user to re-authenticate.


3. Refresh Access Token
  - Used to refresh the long-lived access token
  - Validity: Called Periodically
  - Used to maintain access to the Instagram API

*/

//Refresh Instagram access token to maintain access
export const refreshToken = async (token: string) => {
  const refresh_token = await axios.get(
    `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );

  return refresh_token.data;
};

//Sending Direct Messages
export const sendDM = async (
  userId: string,
  recieverId: string,
  prompt: string,
  token: string
) => {
  console.log("sending message");
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/${INSTAGRAM_GRAPH_API_VERSION}/${userId}/messages`,
    {
      recipient: {
        id: recieverId,
      },
      message: {
        text: prompt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

//Sending Private replies to comments
export const sendPrivateMessage = async (
  userId: string,
  recieverId: string,
  prompt: string,
  token: string
) => {
  console.log("sending message");
  return await axios.post(
    `${process.env.INSTAGRAM_BASE_URL}/${INSTAGRAM_GRAPH_API_VERSION}/${userId}/messages`,
    {
      recipient: {
        comment_id: recieverId,
      },
      message: {
        text: prompt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendInstagramCommentReply = async (
  commentId: string,
  prompt: string,
  token: string
) => {
  try {
    return await axios.post(
      `${process.env.INSTAGRAM_BASE_URL}/${INSTAGRAM_GRAPH_API_VERSION}/${commentId}/replies`,
      {
        message: prompt,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("[instagram:comment_reply] request_failed", {
        commentId,
        status: error.response?.status ?? null,
      });
    }

    throw error;
  }
};

export const sendFacebookCommentReply = async (
  commentId: string,
  prompt: string,
  token: string
) => {
  try {
    return await axios.post(
      `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/${commentId}/comments`,
      {
        message: prompt,
      },
      {
        params: {
          access_token: token,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("[facebook:comment_reply] request_failed", {
        commentId,
        status: error.response?.status ?? null,
      });
    }

    throw error;
  }
};

export const getFacebookCommentDetails = async (
  commentId: string,
  token: string
) => {
  try {
    const response = await axios.get(
      `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/${commentId}`,
      {
        params: {
          fields: "id,message,post{id},from{id,name},parent{id}",
          access_token: token,
        },
      }
    );

    return response.data as {
      id?: string;
      message?: string;
      from?: { id?: string; name?: string };
      parent?: { id?: string };
      post?: { id?: string };
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log("[facebook:comment_details] request_failed", {
        commentId,
        status: error.response?.status ?? null,
      });
    }

    throw error;
  }
};

//exchange a short-lived access token for a long-lived one during the authentication process
export const generateTokens = async (code: string) => {
  const insta_form = new FormData();
  insta_form.append("client_id", getInstagramAppId() as string);

  insta_form.append(
    "client_secret",
    getInstagramAppSecret() as string
  );
  insta_form.append("grant_type", "authorization_code");
  insta_form.append("redirect_uri", instagramOAuthRedirectUri());
  insta_form.append("code", code);

  const shortTokenRes = await fetch(process.env.INSTAGRAM_TOKEN_URL as string, {
    method: "POST",
    body: insta_form,
  });

  const token = await shortTokenRes.json();
  if (token?.access_token) {
    const long_token = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/access_token?grant_type=ig_exchange_token&client_secret=${getInstagramAppSecret()}&access_token=${token.access_token}`
    );

    return long_token.data;
  }
};

export const generateFacebookUserToken = async (code: string) => {
  const shortLivedToken = await axios.get(
    `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token`,
    {
      params: {
        client_id: getFacebookAppId(),
        client_secret: getFacebookAppSecret(),
        redirect_uri: facebookOAuthRedirectUri(),
        code,
      },
    }
  );

  const shortToken = shortLivedToken.data?.access_token;
  if (!shortToken) {
    return null;
  }

  const longLivedToken = await axios.get(
    `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/oauth/access_token`,
    {
      params: {
        grant_type: "fb_exchange_token",
        client_id: getFacebookAppId(),
        client_secret: getFacebookAppSecret(),
        fb_exchange_token: shortToken,
      },
    }
  );

  return longLivedToken.data as {
    access_token: string;
    token_type?: string;
    expires_in?: number | string | null;
  };
};

export const getFacebookPages = async (userAccessToken: string) => {
  const response = await axios.get(
    `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/me/accounts`,
    {
      params: {
        fields: "id,name,access_token",
        access_token: userAccessToken,
      },
    }
  );

  return (response.data?.data ?? []) as {
    id: string;
    name: string;
    access_token: string;
  }[];
};

export const getFacebookPagePosts = async (
  pageId: string,
  pageAccessToken: string
) => {
  const response = await axios.get(
    `${FACEBOOK_GRAPH_BASE_URL}/${FACEBOOK_GRAPH_API_VERSION}/${pageId}/posts`,
    {
      params: {
        fields:
          "id,message,full_picture,permalink_url,created_time,attachments{media_type,media,url,subattachments}",
        limit: 20,
        access_token: pageAccessToken,
      },
    }
  );

  return (response.data?.data ?? []) as Array<{
    id: string;
    message?: string;
    full_picture?: string;
    created_time?: string;
    permalink_url?: string;
    attachments?: {
      data?: Array<{
        media_type?: string;
        media?: { image?: { src?: string } };
        url?: string;
        subattachments?: {
          data?: Array<{
            media?: { image?: { src?: string } };
          }>;
        };
      }>;
    };
  }>;
};

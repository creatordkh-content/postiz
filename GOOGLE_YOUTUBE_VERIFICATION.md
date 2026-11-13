# DKH YouTube OAuth verification

## Current state (13 November 2026)

- Google Cloud project: `dkh-video-automation`.
- OAuth app: `DKH Video Automation`, External, In production.
- Branding: verified and published. Home page: `https://video.mybamus.com/postiz/`; privacy policy: `https://video.mybamus.com/postiz/privacy/`.
- Requested sensitive scopes: `youtube.readonly` and `youtube.upload`. The DKH Postiz patch removes default YouTube Partner, analytics, full-management and `force-ssl` scopes from new OAuth requests.
- Data access: **not verified**. Google still blocks OAuth for the Yoenik account. The existing Yoenik Postiz connection remains on the prior OAuth client, which is in Testing and therefore is not a durable solution.
- Postiz production currently uses the prior OAuth client. Do not switch it to the DKH client until the new OAuth flow can complete and the channel can be reconnected and tested.

## Scope justification draft (Google Cloud Data Access)

> DKH Video Automation is used by our team to publish brand-owned videos prepared in DKH ERP to the corresponding YouTube channels through our self-hosted Postiz instance. The user signs in with Google and selects the channel. youtube.readonly lets us identify the authorized channel and confirm the upload destination before posting. youtube.upload lets us upload the approved video file with its title, description and privacy setting. The content, brand and schedule come from our own ERP. We do not read or manage unrelated Google data. Neither scope alone can both identify the correct channel and upload a video; we removed Postiz’s broader YouTube Partner, analytics and full-management scopes. Only our authorized DKH staff use this workflow.

## Remaining verification evidence

Google requires a publicly accessible demo video link before its Data Access form can be saved and submitted. The video should show the same DKH app and both requested scopes, the full Google OAuth consent screen in English, the selected YouTube channel in Postiz, and a private test upload using the channel. The video must cover every OAuth client in the Google Cloud project. Review the video before sharing because the recording can expose account details. After Google approves the scopes, migrate Postiz to the DKH OAuth client, reconnect Yoenik, and test a private upload and token refresh.

Google's instructions: https://support.google.com/cloud/answer/13804565

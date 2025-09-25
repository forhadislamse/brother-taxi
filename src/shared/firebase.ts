// import admin, { ServiceAccount } from 'firebase-admin';
// import { serviceAccount } from './serviceAccount';
// // import { serviceAccount } from './serviceAccount';

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount as ServiceAccount),
// });

// export default admin;


import admin from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": "sendiyate-a6772",
  "private_key_id": "daa72b59587045f6148e0faff3910a4315771366",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6yJrzUARVoJ3K\n01Jp6JXVzbk1zUlpqRBIgWgahHeCiX4vMiqb5uldqQiSfs8zcg9rSIJkzA7ugfpZ\nViDQJ3EvnSB6gnXm9pXs7mtsrOkzztsydD68a0hrNV0YE39fMntbFvpTn/Ui4TpL\nBAXuitw9fHisMkR978VUqSLgue9Rvs0JrJD535UGn6b7jq/cHXnzhO4uVdc8TlkA\nW9geajmzR0HPc6UyMkp0n9i1293gf5iT+EnGRHhBFFwr2YW6+C7f1OjEKUGX/avP\ns7prZF2ojYL8au8UfRhbCW5XKRgOHcc4RFkq6Mwu05FtGY/xQl3Z/alEMW6/M88k\nACao4dMlAgMBAAECggEAE6Nk20El+4TEIl+ekiEQo+aZ2wTG+7N5UU49zk/wKsre\n+AJbxYF9Nso/avunOF79LQf2Ibfst/n1gvARyiDjfyCTmh3eXJa/g6Y7qDTz3e0Z\nUdA0CmZzOkZlj9L4+N7bZmPflOxD/1NT6DA3mXGDH3nXTC+K0PzlL/YKgzs5ZMwv\nEDI9kPnUxPwl6QyVCSfR3K2oy6JkdHXZFWgIj4xL/weSvpbqjEsfli/TWmmIeWjR\nfdE+a2r9sBDUcYEhXOiOe7qfOg9DJCuIZAM03E3n2tYTWwwNI6HD3WD/OlNMhJ8i\nTgKKSNOusFAC8fSiZlPXZH5c1q2t3qtQ03J2nb5nPwKBgQDzE+UEvz0m/k5PSJ5v\nD+ysCoIyF3m0BCGFX2hOKRbw4Wek6Wxx24mAqh4NhUFnCTCvlbliT2kyq87hry9R\nGqwCaPGqCelQXFUj8vQ0aIxNhJCCsLGHD+WGj5BD98ZIHj08IwPsqH/TYP8UlioJ\nrrVd6oTJ2GpKJ5JfOqpcKgYmSwKBgQDEtpcXTUBzBIzA46VU7O1tbMpIRhLqb+lM\n2SPprc/WP2WTMheUaRSljkRvSLg6SNEwfQBsWmalV4Ep7X6cpunouX+Vtq775fpb\naFOsl/u0fqSp6VQ7nSApQrg/JcLlCusnMWHGpYU+k6kCcQqreD7z2TCPuiaRTnOg\n0CdKy1rGTwKBgG/dJ/gXSj03qzIxaTgTTAegjmofA5Mkk4idb5MItdYE5X2vLoj3\nT0A3Cb2PJZoVUKJ9dOMZSIBZMMwLourgK2iwgwaNqSGiXEw+8sNrmaXS6+45Ann1\nhtt2Fh4xWL63q9aRBq1SngDZEoqW0KHEFRMzagi537BgpavNg7kGXe4hAoGAIZEC\noTBGchnxpqxxttcjAIwSzFhgu+5SwhE/Zo2JLIbu3zop+eIgasum89JV1WQ9heee\nnd6jK02ONchX1YVJ3rNgiPx+SW+J0/UuagIZKkh98pxlCjManM/MvsHDyu+dBrgP\ndiUiYnYx3b/KUU4Yd+W0uqHKGPtpEaTTP5kJqVMCgYEAzHrU1RvAdug+cKfDimPC\n09OnRv73Td5GrDG0KkqOjm8GwdXzC0YRQy3ti3gFn+zjrWsjQt7fA3fgfOGzz9sN\n50DvKnk5eXWFdBKFiAw0aahnl19eokv8XN+0PQY2r2ob+kxOL6tCd01JCTh8Vqk4\nzKGIVcnH6nk+OLzOWDN+KSQ=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@sendiyate-a6772.iam.gserviceaccount.com",
  "client_id": "110566743883420324614",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sendiyate-a6772.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;

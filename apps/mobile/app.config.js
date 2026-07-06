// Dynamic config layered over app.json (Expo merges both; `config` below is
// app.json's contents). Exists for exactly one reason: google-services.json
// is NOT committed — on EAS builds it arrives as a secret file env var
// (GOOGLE_SERVICES_JSON holds the path EAS materialized it at), while local
// builds use the developer's own copy next to this file.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});

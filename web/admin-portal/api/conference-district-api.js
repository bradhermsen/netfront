const ConferenceDistrictApi = {
  async getAll() {
    const res = await authFetch("/conferencedistricts");
    if (!res || !res.ok) {
      throw new Error(`Failed to load conference districts (${res?.status || "no response"})`);
    }

    const payload = await res.json();
    if (!Array.isArray(payload)) {
      throw new Error(payload?.error || "ConferenceDistricts response was not an array");
    }

    return payload;
  },
};

const SectionRegionApi = {
  async getAll() {
    const res = await authFetch("/sectionregions");
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const payload = await res.json();
    if (!Array.isArray(payload)) {
      throw new Error(payload?.error || "SectionRegions response was not an array");
    }

    return payload;
  },
};

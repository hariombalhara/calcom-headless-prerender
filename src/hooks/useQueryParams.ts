/**
 * These are the routing fields that routing rules depend on.
 * They MUST be present in the URL for prerender to work correctly.
 */
export const REQUIRED_ROUTING_PARAMS = ["formId"] as const;

/**
 * Extra fields passed to the booking form but NOT required by routing rules.
 */
export const OPTIONAL_BOOKING_PARAMS = ["firstName", "lastName", "phone"] as const;

export type RequiredRoutingParam = (typeof REQUIRED_ROUTING_PARAMS)[number];

export function useQueryParams() {
  const searchParams = new URLSearchParams(window.location.search);

  const formId = searchParams.get("formId");
  const email = searchParams.get("email") ?? "";
  const companySize = searchParams.get("companySize") ?? "";
  const firstName = searchParams.get("firstName") ?? "";
  const lastName = searchParams.get("lastName") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const calOrigin = searchParams.get("calOrigin") ?? "https://app.cal.com";
  const embedJsUrl =
    searchParams.get("embedJsUrl") ?? "https://app.cal.com/embed.js";
  const backgroundSlotsFetch =
    searchParams.get("backgroundSlotsFetch") !== "false";

  const missingRequired: RequiredRoutingParam[] = REQUIRED_ROUTING_PARAMS.filter(
    (p) => !searchParams.get(p)
  );

  return {
    formId,
    email,
    companySize,
    firstName,
    lastName,
    phone,
    calOrigin,
    embedJsUrl,
    backgroundSlotsFetch,
    missingRequired,
  };
}

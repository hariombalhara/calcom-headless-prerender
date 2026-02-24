import { useEffect, useState } from "react";
import { getCalApi } from "@calcom/embed-react";
import { useQueryParams } from "./hooks/useQueryParams";

function useCalApi(embedJsUrl: string) {
  const [cal, setCal] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const calInstance = await getCalApi({
        embedJsUrl,
        namespace: "params-prerender",
      });
      setCal(() => calInstance);
    })();
  }, [embedJsUrl]);
  return cal;
}

function useTimingTracker(cal: any) {
  useEffect(() => {
    if (!cal) return;
    let connectStartedAt = 0;

    function onConnectInitiated() {
      connectStartedAt = Date.now();
    }
    function onConnectCompleted() {
      console.log(
        "Time taken to show booking page: ",
        Date.now() - connectStartedAt,
        "ms"
      );
    }

    cal("on", { action: "__connectInitiated", callback: onConnectInitiated });
    cal("on", { action: "__connectCompleted", callback: onConnectCompleted });
    return () => {
      cal("off", { action: "__connectInitiated", callback: onConnectInitiated });
      cal("off", { action: "__connectCompleted", callback: onConnectCompleted });
    };
  }, [cal]);
}

function buildRouterUrl(
  formId: string,
  params: Record<string, string>
): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  return `router?form=${formId}&${sp.toString()}`;
}

const AllRoutingDataInParams = () => {
  const {
    formId,
    email,
    companySize,
    firstName,
    lastName,
    phone,
    calOrigin,
    embedJsUrl,
    backgroundSlotsFetch,
  } = useQueryParams();

  const cal = useCalApi(embedJsUrl);
  useTimingTracker(cal);

  const [prerendered, setPrerendered] = useState(false);

  // Log silently if routing params needed for prerender are missing
  useEffect(() => {
    const missingForPrerender = [
      !formId && "formId",
      !email && "email",
      !companySize && "companySize",
    ].filter(Boolean) as string[];

    if (missingForPrerender.length > 0) {
      console.error(
        `[AllRoutingDataInParams] Prerender skipped — missing params: ${missingForPrerender.join(", ")}. ` +
        `These must be present in the URL for routing to work.`
      );
    }
  }, []); // Log once on mount

  // Prerender as soon as cal is ready and all params needed for routing are present
  useEffect(() => {
    if (!cal || !formId || !email || !companySize) return;

    const calLink = buildRouterUrl(formId, { email, companySize });
    console.log("[AllRoutingDataInParams] Prerendering with calLink:", calLink);

    cal("prerender", {
      calLink,
      type: "modal",
      calOrigin,
      pageType: "team.event.booking.slots",
      options: { backgroundSlotsFetch },
    });
    setPrerendered(true);
  }, [cal]); // Only re-prerender when cal instance changes; params come from URL and are stable

  const ctaCalLink =
    formId && email && companySize
      ? buildRouterUrl(formId, {
        email,
        companySize,
        firstName,
        lastName,
        phone,
      })
      : "";

  const buildVariantUrl = (backgroundSlotsFetchValue: boolean) => {
    const params = new URLSearchParams(window.location.search);
    params.set("backgroundSlotsFetch", String(backgroundSlotsFetchValue));
    return `?${params.toString()}`;
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>All Routing Data in Query Params</h1>
        <p className="subtitle">
          All routing fields are already in the URL — prerender fires immediately
          on page load, no user input needed.
        </p>
        <div className="variant-links">
          <a
            href={buildVariantUrl(true)}
            className={backgroundSlotsFetch ? "active" : undefined}
          >
            Background Slots Fetch
          </a>
          <a
            href={buildVariantUrl(false)}
            className={!backgroundSlotsFetch ? "active" : undefined}
          >
            No Background Slots Fetch
          </a>
        </div>
      </header>

      {/* How it works */}
      <section className="info-section">
        <h2>How prerendering works here</h2>
        <ol>
          <li>
            Page loads → reads <code>email</code> &amp; <code>companySize</code>{" "}
            (and <code>formId</code>) from the URL.
          </li>
          <li>
            As soon as the Cal embed JS is ready,{" "}
            <code>cal("prerender", …)</code> is called — no waiting for user
            input.
          </li>
          <li>
            When the user clicks <strong>Book a Demo</strong>, the modal opens
            instantly from the prerendered iframe.
          </li>
          <li>
            If any required param is missing the prerender call is skipped and
            an error is logged to the console.
          </li>
        </ol>
      </section>

      {/* CTA */}
      <div className="cta-area">
        <button
          className="cta-button"
          data-cal-namespace="params-prerender"
          data-cal-link={ctaCalLink}
          data-cal-origin={calOrigin}
          data-cal-config='{"layout":"month_view"}'
        >
          Book a Demo
          <span className="cta-sub">
            {prerendered
              ? "Prerendering"
              : "Could not prerender"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AllRoutingDataInParams;

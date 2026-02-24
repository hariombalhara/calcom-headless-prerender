import "./App.css";
import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import React, { useState } from "react";
import { useQueryParams } from "./hooks/useQueryParams";

function useCalApi(embedJsUrl: string) {
  const [cal, setCal] = useState<any>(null);
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ embedJsUrl, namespace: "headl" });
      setCal(() => cal);
    })();
  }, [embedJsUrl]);
  return cal;
}

// This is same as you get from Embed Snippet Generator on Cal.com with the difference that it has props that can configure it from outside
const EmbedCta = ({
  cal,
  calLink,
  calOrigin,
  children,
}: {
  cal: any;
  calLink: string;
  calOrigin: string;
  children: React.ReactNode;
}) => {
  return (
    <button
      data-cal-namespace="headl"
      data-cal-link={calLink}
      data-cal-origin={calOrigin}
      // data-cal-origin="https://i.cal.com"
      data-cal-config='{"layout":"month_view"}'
    >
      {children}
    </button>
  );
};
let connectStartedAt = 0;
let connectCompletedAt = 0;

function useCalculateTimeTakenToShowBookingPage(cal: any) {
  useEffect(() => {
    if (!cal) return;

    function onConnectInitiated() {
      connectStartedAt = Date.now();
    }

    function onConnectCompleted() {
      connectCompletedAt = Date.now();
      const connectionDuration = connectCompletedAt - connectStartedAt;
      console.log("Time taken to show booking page: ", connectionDuration);
    }

    cal("on", {
      action: "__connectCompleted",
      callback: onConnectCompleted,
    });
    cal("on", {
      action: "__connectInitiated",
      callback: onConnectInitiated,
    });

    return () => {
      cal("off", {
        action: "__connectInitiated",
        callback: onConnectInitiated,
      });
      cal("off", {
        action: "__connectCompleted",
        callback: onConnectCompleted,
      });
    };
  }, [cal]);
}

const App = () => {
  type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companySize: string;
  };
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companySize: "",
  });

  const [routerUrl, setRouterUrl] = useState("");

  const { formId, calOrigin, embedJsUrl } = useQueryParams();
  const cal = useCalApi(embedJsUrl);
  useCalculateTimeTakenToShowBookingPage(cal);

  if (!formId) {
    return (
      <div style={{ color: "red", padding: "1rem" }}>
        Error: <code>formId</code> query parameter is required. Please provide it in the URL, e.g. <code>?formId=YOUR_FORM_ID</code>
      </div>
    );
  }

  if (!/^https?:\/\//.test(calOrigin)) {
    return (
      <div style={{ color: "red", padding: "1rem" }}>
        Error: <code>calOrigin</code> must start with <code>http://</code> or <code>https://</code>. Got: <code>{calOrigin}</code>
      </div>
    );
  }

  const buildRouterUrl = (formData: FormData, params: string[]) => {
    const searchParams = new URLSearchParams();
    params.forEach((param) => {
      searchParams.set(param, formData[param as keyof FormData]);
    });

    return `router?form=${formId}&${searchParams.toString()}`;
  };

  const buildPrerenderUrl = (formData: FormData) => {
    return buildRouterUrl(formData, ["email", "companySize"]);
  };

  const buildCtaClickUrl = (formData: FormData) => {
    return buildRouterUrl(formData, [
      "email",
      "companySize",
      "firstName",
      "lastName",
      "phone",
    ]);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    return newFormData;
  };

  function prerender(newFormData?: FormData) {
    const formDataToUse = newFormData ?? formData;
    const newRouterUrl = buildPrerenderUrl(formDataToUse);
    const fieldsRequiredByRoutingRules = ["email", "companySize"];
    const isRouterDataAvailable = () => {
      return fieldsRequiredByRoutingRules.every(
        (field) => formDataToUse[field as keyof FormData]
      );
    };
    const isRouterDataChanged = () => {
      // Needed by URL()
      const dummyOrigin = "https://example.com";
      const newRouterUrlObject = new URL(newRouterUrl, dummyOrigin);
      const existingRouterUrlObject = new URL(routerUrl, dummyOrigin);

      return fieldsRequiredByRoutingRules.some(
        (fieldName) =>
          newRouterUrlObject.searchParams.get(fieldName) !==
          existingRouterUrlObject.searchParams.get(fieldName)
      );
    };
    // Don't prerender if the complete data required by Router is not filled by user
    if (cal && isRouterDataChanged() && isRouterDataAvailable()) {
      // Update Router URL to compare with the new URL and detect if we need to re-prerender
      setRouterUrl(newRouterUrl);
      const pageSearchParams = new URL(document.URL).searchParams;
      // We try to prerender the page with only that data that is needed by Routing Rules.
      // If we include all the fields of the form here, then prerender is delayed and user won't benefit much with prerendering
      cal("prerender", {
        calLink: newRouterUrl,
        type: "modal",
        calOrigin,
        pageType: "team.event.booking.slots",
        options: {
          backgroundSlotsFetch:
            pageSearchParams.get("backgroundSlotsFetch") === "true",
        },
      });
    }
  }

  function onInputChangeComplete() {
    prerender();
  }

  const handleSubmit = (event) => {
    // You can submit the data to your server as well or to any other third party here
    console.log(formData);
    // Ensure that form doesn't redirect to the action and instead lets us show the embed
    return event.preventDefault();
  };

  return (
    <>
      <h2>Demo - Headless Router with User Form</h2>
      <p>Schedule a demo - Uses prerendering</p>
      <span
        style={{ display: "flex", justifyContent: "space-around", gap: "2px" }}
      >
        {(["true", "false"] as const).map((value) => {
          const params = new URLSearchParams(window.location.search);
          params.set("backgroundSlotsFetch", value);
          params.set("cal.embed.logging", "1");
          return (
            <a key={value} href={`?${params.toString()}`}>
              {value === "true" ? "Background Slots Fetch" : "No Background Slots Fetch"}
            </a>
          );
        })}
      </span>
      <ul style={{ textAlign: "left" }}>
        <li>
          companySize and email are the fields required by the routing rules and
          we have kept the at the top so that there are higher chances of user
          prefilling them first and prerendering would start then
        </li>
        <li>
          On succesful form submission with 10-100 company size it selects a
          member
        </li>
        <li>
          On succesful form submission with {">"} 500 company size it selects a
          different member
        </li>
      </ul>

      <form onSubmit={handleSubmit} method="GET">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          onBlur={onInputChangeComplete}
          placeholder="Work email"
          required
        />

        <select
          name="companySize"
          value={formData.companySize}
          onChange={(e) => {
            const newFormData = handleInputChange(e);
            // There is no onBlur for select. Also, handleInputChange will update the formData in next render.
            // So, we need to prerender by passing the data directly
            prerender(newFormData);
          }}
          required
        >
          <option value="" disabled>
            Company size
          </option>
          <option value="1-10">{"1-10"}</option>
          <option value="10-100">10-100</option>
          <option value="100-500">100-500</option>
          <option value="> 500">{">500"}</option>
        </select>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          onBlur={onInputChangeComplete}
          placeholder="First Name"
          required
        />

        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          onBlur={onInputChangeComplete}
          placeholder="Last Name"
          required
        />

        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          onBlur={onInputChangeComplete}
          placeholder="Phone"
          required
        />
        {/* calLink routerUrl must have the data that was actually submitted by the user  */}
        <EmbedCta
          cal={cal}
          calLink={buildCtaClickUrl(formData)}
          calOrigin={calOrigin}
        >
          Book a Demo
        </EmbedCta>
      </form>
    </>
  );
};

export default App;

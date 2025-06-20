import "./App.css";
import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import React, { useState } from "react";
const formId = "8cfd7889-9043-4e20-9a09-db8e2c9f747c";
const calOrigin = "https://i.cal.com";
const embedJsUrl = "https://app.cal.com/embed/embed.js";

function useCalApi() {
  const [calRegular, setCalRegular] = useState<any>(null);
  const [calPrerender, setCalPrerender] = useState<any>(null);
  useEffect(() => {
    (async function () {
      const calPrerender = await getCalApi({
        namespace: "calcom-prerender",
      });

      const calRegular = await getCalApi();
      setCalRegular(() => calRegular);
      setCalPrerender(() => calPrerender);
    })();
  }, [embedJsUrl]);
  return { calPrerender, calRegular };
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
      data-cal-namespace="calcom-prerender"
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

  const { calPrerender: cal } = useCalApi();
  useCalculateTimeTakenToShowBookingPage(cal);

  const buildRouterUrl = (formData: FormData) => {
    const searchParams = new URLSearchParams();

    // "firstName" and "lastName" are the identifier for the name field in Routing Form
    searchParams.set("firstName", formData.firstName);
    searchParams.set("lastName", formData.lastName);
    searchParams.set("phone", formData.phone);

    // "email" is the identifier for the email field in Routing Form
    searchParams.set("email", formData.email);
    // "companySize" is the identifier for the Company Size field in Routing Form
    // Encode if there are any special parameters e.g. companySize has 2000+ option where + is a special character
    searchParams.set("companySize", formData.companySize);
    const pageSearchParams = new URL(document.URL).searchParams;
    if (pageSearchParams.get("cal.isBookingDryRun") === "true") {
      searchParams.set("cal.isBookingDryRun", "true");
    }
    return `router?debug=true&form=${formId}&${searchParams.toString()}`;
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
    const newRouterUrl = buildRouterUrl(formDataToUse);
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
      setRouterUrl(newRouterUrl);
      // We try to prerender the page with only that data that is needed by Routing Rules.
      // If we include all the fields of the form here, then prerender is delayed and user won't benefit much with prerendering
      cal("prerender", {
        calLink: newRouterUrl,
        type: "modal",
        pageType: "team.event.booking.slots",
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
    <div style={{ width: "300px", margin: "auto" }}>
      <h2>Demo - Headless Router with User Form</h2>
      <p>Schedule a demo - Uses prerendering</p>
      <ul>
        <li>
          companySize and email are the fields required by the routing rules and
          we have kept the at the top so that there are higher chances of user
          prefilling them first and prerendering would start then
        </li>
        <li>1-10 company size is assigned to Hariom</li>
        <li>{">"} 500 company size is assigned to Joe</li>
        <li>test@test1.com email is owned by Joe in salesforce</li>
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
          calLink={buildRouterUrl(formData)}
          calOrigin={calOrigin}
        >
          Book a Demo
        </EmbedCta>
      </form>
    </div>
  );
};

export default App;

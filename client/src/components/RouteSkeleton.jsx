import "./RouteSkeleton.css";
import useThemedLogo from "../hooks/useThemedLogo";

export function RouteSkeleton() {
  const logoCompact = useThemedLogo();

  return (
    <div className="route-loader">
      <div className="route-loader__content">
        <img src={logoCompact} alt="MediMate" className="route-loader__logo" />
        <div className="route-loader__heartbeat-track">
          <svg
            className="route-loader__heartbeat-svg"
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
          >
            <polyline
              className="route-loader__heartbeat-line"
              points="0,40 80,40 110,40 130,12 150,68 170,28 190,52 210,40 280,40 310,40 330,12 350,68 370,28 390,52 410,40 480,40 510,40 530,12 550,68 570,28 590,52 600,40"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="route-loader__text">Loading</p>
      </div>
    </div>
  );
}

export function DashboardSectionSkeleton() {
  return (
    <div
      className="route-loader"
      style={{ minHeight: "auto", padding: "2rem" }}
    >
      <div className="route-loader__content">
        <div
          className="route-loader__heartbeat-track"
          style={{ maxWidth: "180px" }}
        >
          <svg
            className="route-loader__heartbeat-svg"
            viewBox="0 0 600 80"
            preserveAspectRatio="none"
          >
            <polyline
              className="route-loader__heartbeat-line"
              points="0,40 80,40 110,40 130,12 150,68 170,28 190,52 210,40 280,40 310,40 330,12 350,68 370,28 390,52 410,40 480,40 510,40 530,12 550,68 570,28 590,52 600,40"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

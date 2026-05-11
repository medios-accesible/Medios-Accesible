import DesktopHome from "../components/DesktopHome";
import MobileHome from "../components/MobileHome";

export default function HomePage() {
  return (
    <>
      <div className="desktop-only-home">
        <DesktopHome />
      </div>

      <div className="mobile-only-home">
        <MobileHome />
      </div>
    </>
  );
}

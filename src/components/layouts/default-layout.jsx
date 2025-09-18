import { ReactNode } from "react";
import { useThemedImgSrc } from "../../lib/utils";

/**
 * @param {{ children: ReactNode }} props
 */
export const DefaultLayout = ({ children }) => {
  const backgroundSrc = useThemedImgSrc("background.svg");
  return (
    <div
      style={{ backgroundImage: `url(${backgroundSrc})` }}
      className="bg-no-repeat bg-cover bg-center"
    >
      <div className="flex flex-col flex-1 px-25 py-10  min-h-screen max-w-[1440px] mx-auto gap-8">
        <Header />
        {children}
      </div>
    </div>
  );
};

const Header = () => {
  const logoSrc = useThemedImgSrc("header-logo.svg");
  return (
    <div className="w-full flex flex-row justify-between items-center">
      <img src={logoSrc} alt="Origami" className="h-8" />
    </div>
  );
};

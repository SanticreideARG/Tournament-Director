import { useSettingsStore } from '../store/useSettingsStore';
import { isLightTheme } from '../lib/themes';
import WaterShader from './WaterShader';
import Fireflies from './backgrounds/Fireflies';
import Snow from './backgrounds/Snow';
import Starfield from './backgrounds/Starfield';
import Aurora from './backgrounds/Aurora';
import Bokeh from './backgrounds/Bokeh';

/** Fondo global: despacha al fondo animado elegido, una imagen propia o color sólido. */
export default function AppBackground() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const theme = useSettingsStore((s) => s.theme);
  const light = isLightTheme(theme);

  switch (wallpaper) {
    case 'shader':
      return <WaterShader light={light ? 1 : 0} />;
    case 'fireflies':
      return <Fireflies />;
    case 'snow':
      return <Snow dark={!light} />;
    case 'starfield':
      return <Starfield dark={!light} />;
    case 'aurora':
      return <Aurora />;
    case 'bokeh':
      return <Bokeh />;
    case 'none':
      return null;
    default:
      return <div className="bg-image" style={{ backgroundImage: `url(${wallpaper})` }} aria-hidden />;
  }
}

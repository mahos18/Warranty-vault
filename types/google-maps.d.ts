declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options: MapOptions);
    }
    class Marker {
      constructor(options: MarkerOptions);
      addListener(event: string, handler: () => void): void;
    }
    class InfoWindow {
      constructor(options: { content: string });
      open(map: Map, marker: Marker): void;
    }
    interface MapOptions {
      center: LatLngLiteral;
      zoom: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      zoomControl?: boolean;
    }
    interface MarkerOptions {
      position: LatLngLiteral;
      map: Map;
      label?: string | MarkerLabel;
      title?: string;
      icon?: Symbol | string;
      zIndex?: number;
    }
    interface MarkerLabel {
      text: string;
      color?: string;
      fontWeight?: string;
      fontSize?: string;
    }
    interface Symbol {
      path: SymbolPath;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }
    interface LatLngLiteral { lat: number; lng: number; }
    enum SymbolPath { CIRCLE = 0 }
  }
}
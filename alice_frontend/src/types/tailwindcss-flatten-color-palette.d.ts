declare module 'tailwindcss/lib/util/flattenColorPalette' {
    interface ColorPalette {
      [key: string]: string | ColorPalette;
    }
  
    function flattenColorPalette(colors: ColorPalette): { [key: string]: string };
  
    export = flattenColorPalette;
  }
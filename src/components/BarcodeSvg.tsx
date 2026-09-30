import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value?: string;
  barcodeValue?: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  showCode?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  barcodeValue,
  format = 'CODE128',
  width = 1.4,
  height = 36,
  displayValue = true,
  showCode,
  fontSize = 11,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const actualValue = value || barcodeValue || '';
  const shouldDisplayValue = showCode !== undefined ? showCode : displayValue;

  useEffect(() => {
    if (svgRef.current && actualValue) {
      try {
        JsBarcode(svgRef.current, actualValue, {
          format: format,
          width: width,
          height: height,
          displayValue: shouldDisplayValue,
          font: 'sans-serif',
          fontOptions: 'bold',
          fontSize: fontSize,
          margin: 2,
          marginTop: 2,
          marginBottom: 2,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('Barcode render error, fallback to code128 auto:', err);
        try {
          JsBarcode(svgRef.current, actualValue, {
            width: width,
            height: height,
            displayValue: shouldDisplayValue,
            fontSize: fontSize,
          });
        } catch {
          // Ignore fallback errors
        }
      }
    }
  }, [actualValue, format, width, height, shouldDisplayValue, fontSize]);

  if (!actualValue) {
    return <div className="text-xs text-red-500 italic">لا يوجد باركود</div>;
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};

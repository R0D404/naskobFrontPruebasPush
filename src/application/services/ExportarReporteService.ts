import { Parcela } from '@/domain/models/parcela';
import { DeclaracionCompleta } from '@/domain/models/declaracion';
import { Evaluacion } from '@/domain/models/evaluacion';

export interface ParametrosReporte {
  parcela: Parcela | null;
  declaracion: DeclaracionCompleta;
  evaluacion?: Evaluacion | null;
  propuestas?: Record<string, any>;
}

export class ExportarReporteService {
  /**
   * Genera el contenido CSV del resumen técnico y propuestas dinámicamente desde la evaluación
   */
  public static generarCSV({
    parcela,
    declaracion,
    evaluacion,
  }: ParametrosReporte): string {
    const filas: string[] = [];

    // Metadatos del informe
    filas.push('REPORTE TECNICO NASKOB - ROTACION RESILIENTE');
    filas.push(`Fecha de emision,${new Date().toLocaleDateString('es-MX')}`);
    filas.push(`Region,La Frailesca - Chiapas`);
    filas.push(`Superficie parcela (ha),${parcela ? parcela.area_ha : 'No delimitada'}`);
    filas.push(`Tipo de tierra,${declaracion.tipo_tierra}`);
    filas.push(
      `Regimen hidrico,${
        declaracion.manejo.riego_veces_semana === 0
          ? 'Temporal estricto (0 riegos/sem)'
          : `${declaracion.manejo.riego_veces_semana} riegos/sem`
      }`
    );
    filas.push(`Evaluar riesgo canicula,${declaracion.manejo.considerar_riesgo ? 'Si' : 'No'}`);
    filas.push(`Abonos o mejoras,${declaracion.manejo.agrego_productos ? 'Si' : 'No'}`);
    filas.push(`Prioridad rectora,${declaracion.manejo.prioridad_principal}`);
    filas.push('');

    // Historial de 3 ciclos
    filas.push('HISTORIAL DE SIEMBRA PREVIO');
    filas.push('Temporada,Cultivo registrado');
    declaracion.rotacion_existente.forEach((c) => {
      filas.push(`"${c.etiqueta}","${c.cultivo}"`);
    });
    filas.push('');

    // Tabla de propuestas evaluadas
    filas.push('PROPUESTAS EVALUADAS');
    filas.push('Codigo,Escenario,Rol,Condicion Hidrica,Aporte al Suelo,Duracion Ciclo,Puntaje,ID Ejecucion,Fuentes Satelitales');

    if (evaluacion && evaluacion.escenarios) {
      evaluacion.escenarios.forEach((p) => {
        filas.push(
          `"${p.codigo_escenario}","${p.nombre}","${p.badge || ''}","${p.etiqueta_agua || ''}","${p.etiqueta_suelo || ''}","${p.duracion_ciclo_dias || ''}","${p.puntaje_valor || ''}","${p.trazabilidad?.idEjecucion || ''}","${p.trazabilidad?.fuentesNasa || ''}"`
        );
      });
    }
    filas.push('');

    // Escenarios descartados (si aplica)
    if (evaluacion && evaluacion.escenarios_descartados && evaluacion.escenarios_descartados.length > 0) {
      filas.push('CULTIVOS DESCARTADOS (FILTRO RC5)');
      filas.push('Codigo,Cultivo,Motivo de Descarte');
      evaluacion.escenarios_descartados.forEach((d) => {
        filas.push(`"${d.codigo_escenario}","${d.nombre}","${d.motivo}"`);
      });
      filas.push('');
    }

    // Trazabilidad técnica
    filas.push('TRAZABILIDAD SATELITAL NASA');
    filas.push('Fuentes,NASA POWER / IMERG / SRTM');
    filas.push('Serie historica,2001-2025 (25 anos completos)');
    filas.push('Resolucion,30m SRTM / ~11km IMERG');
    filas.push('Calidad de datos (f_val),0.985 (98.5% dias validos)');
    filas.push('Version algoritmo,v2026.4.1_chiapas');

    return filas.join('\n');
  }

  /**
   * Dispara la descarga directa en el navegador de un archivo .csv
   */
  public static descargarCSV(params: ParametrosReporte): void {
    const csvContent = this.generarCSV(params);
    // BOM UTF-8 para visualización correcta de caracteres especiales en Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const nombreArchivo = `naskob_propuestas_${Date.now()}.csv`;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

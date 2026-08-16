"use client";

import { Lightbulb } from "lucide-react";

const TIPS = [
  "Regla del 50/30/20: 50% necesidades, 30% gustos, 20% ahorro.",
  "Antes de invertir, asegúrate de tener un fondo de emergencia de 6 meses.",
  "Revisa tus suscripciones cada 3 meses. Seguro que hay alguna que no usas.",
  "El interés compuesto es el octavo maravilla del mundo. Empieza a invertir cuanto antes.",
  "No pongas todos los huevos en la misma cesta. Diversifica tus inversiones.",
  "Automatiza tus ahorros. Que se transfieran solos el día de la nómina.",
  "Compara antes de contratar. Un 0,5% de comisión menos puede ser miles de euros en 20 años.",
  "Evita deudas de consumo. Si no puedes pagarlo al contado, probablemente no lo necesites.",
  "Revisa tu hipoteca anualmente. A veces merece la pena subrogar.",
  "El mejor momento para empezar a invertir fue hace 10 años. El segundo mejor momento es ahora.",
  "Lleva un registro de todos tus gastos durante un mes. Te sorprenderá dónde se va el dinero.",
  "No inviertas en algo que no entiendas. Si no puedes explicarlo, no lo compres.",
  "Tu coche es el activo que más te deprecia. Piénsalo antes de cambiarlo.",
  "Aprovecha los planes de pensiones y el descuento fiscal. Es dinero gratis del Estado.",
  "La paciencia es la virtud más importante en inversión. El tiempo es tu mejor aliado.",
  "No intentes batir al mercado. Los fondos indexados ganan al 80% de los gestores activos.",
  "Antes de una compra grande, espera 48 horas. Muchas veces el impulso pasa.",
  "Negocia tu salario anualmente. Un aumento del 3% es normal, del 10% es posible.",
  "Usa cuentas remuneradas para tu fondo de emergencia. Que el dinero trabaje mientras espera.",
  "El lujo de hoy puede ser la deuda de mañana. Vive por debajo de tus posibilidades.",
  "Invierte en ti mismo. Cursos, libros y networking tienen el mejor ROI.",
  "No sigas ciegamente las modas de inversión. Cripto, NFTs... muchos pierden dinero.",
  "Planifica tus compras con lista. Ir al supermercado con hambre es caro.",
  "Revisa tu seguro de vida y hogar cada año. Puedes ahorrar mucho comparando.",
  "Si tu empresa tiene plan de acciones o retribución flexible, apróvechalo.",
  "El ahorro no es lo que te sobra, es lo que pagas a ti mismo primero.",
  "Un café de 2€ al día son 730€ al año. Pequeños gastos, grandes sumas.",
  "Mantén un presupuesto flexible. La vida cambia y tu plan debe adaptarse.",
  "No compares tu capítulo 1 con el capítulo 20 de otro. Cada uno va a su ritmo.",
  "La verdadera riqueza es la libertad. No solo se mide en euros.",
];

export function TipsWidget() {
  const dayOfMonth = new Date().getDate();
  const tip = TIPS[(dayOfMonth - 1) % TIPS.length];

  return (
    <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Tip del día</p>
      </div>
      <p className="text-zinc-400 text-[11px] leading-relaxed">&ldquo;{tip}&rdquo;</p>
    </div>
  );
}

/**
 * Раздел «Notebooks» — лабораторные работы практикума.
 * Рендерит <iframe srcdoc> с HTML, полученным из .ipynb через pandoc.
 */

import MaterialSection from '../components/MaterialSection';
import { sections } from '../content';

export default function Notebooks() {
  return <MaterialSection section={sections.notebooks} />;
}

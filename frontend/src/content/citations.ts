// The reference base. Every DOI here was verified against Crossref or the publisher record.
// Consumed by the shell's CitationsProvider so <Cite id="..."/> and <Refs/> resolve to real links.

import type { Citation } from '@fasl-work/caos-app-shell';

export const CITATIONS: Citation[] = [
  {
    id: 'badarneh2026',
    label: 'Badarneh 2026',
    citation:
      'M. H. Badarneh, P. Cai, E. J. G. Santos, Optimal Control Drives Ultrafast and Energy-Efficient Magnetization Switching in Van der Waals Magnets, Advanced Materials e23059 (2026).',
    doi: '10.1002/adma.202523059',
  },
  {
    id: 'kwiatkowski2021',
    label: 'Kwiatkowski 2021',
    citation:
      'G. J. Kwiatkowski, M. H. A. Badarneh, D. V. Berkov, P. F. Bessarab, Optimal Control of Magnetization Reversal in a Monodomain Particle by Means of Applied Magnetic Field, Phys. Rev. Lett. 126, 177206 (2021).',
    doi: '10.1103/PhysRevLett.126.177206',
  },
  {
    id: 'badarneh2023',
    label: 'Badarneh 2023',
    citation:
      'M. H. A. Badarneh, G. J. Kwiatkowski, P. F. Bessarab, Reduction of energy cost of magnetization switching in a biaxial nanoparticle by use of internal dynamics, Phys. Rev. B 107, 214448 (2023).',
    doi: '10.1103/PhysRevB.107.214448',
  },
  {
    id: 'e2007string',
    label: 'E 2007',
    citation:
      'W. E, W. Ren, E. Vanden-Eijnden, Simplified and improved string method for computing the minimum energy paths in barrier-crossing events, J. Chem. Phys. 126, 164103 (2007).',
    doi: '10.1063/1.2720838',
  },
  {
    id: 'bessarab2015',
    label: 'Bessarab 2015',
    citation:
      'P. F. Bessarab, V. M. Uzdin, H. Jonsson, Method for finding mechanism and activation energy of magnetic transitions, applied to skyrmion and antivortex annihilation, Comput. Phys. Commun. 196, 335 (2015).',
    doi: '10.1016/j.cpc.2015.07.001',
  },
  {
    id: 'vlasov2022',
    label: 'Vlasov 2022',
    citation:
      'S. M. Vlasov, G. J. Kwiatkowski, I. S. Lobanov, V. M. Uzdin, P. F. Bessarab, Optimal protocol for spin-orbit torque switching of a perpendicular nanomagnet, Phys. Rev. B 105, 134404 (2022).',
    doi: '10.1103/PhysRevB.105.134404',
  },
  {
    id: 'sunwang2006',
    label: 'Sun & Wang 2006',
    citation:
      'Z. Z. Sun, X. R. Wang, Theoretical Limit of the Minimal Magnetization Switching Field and the Optimal Field Pulse for Stoner Particles, Phys. Rev. Lett. 97, 077205 (2006).',
    doi: '10.1103/PhysRevLett.97.077205',
  },
  {
    id: 'scheie2022',
    label: 'Scheie 2022',
    citation:
      'A. Scheie, M. Ziebel, D. G. Chica, et al., Spin Waves and Magnetic Exchange Hamiltonian in CrSBr, Advanced Science 9, 2202467 (2022).',
    doi: '10.1002/advs.202202467',
  },
  {
    id: 'rudenko2023',
    label: 'Rudenko 2023',
    citation:
      'A. N. Rudenko, M. Rosner, M. I. Katsnelson, Dielectric tunability of magnetic properties in orthorhombic ferromagnetic monolayer CrSBr, arXiv:2302.12672 (2023).',
    doi: '10.48550/arXiv.2302.12672',
  },
  {
    id: 'ruiz2024',
    label: 'Ruiz 2024',
    citation:
      'A. M. Ruiz, D. L. Esteras, D. Lopez-Alcala, J. J. Baldovi, On the Origin of the Above-Room-Temperature Magnetism in the 2D van der Waals Ferromagnet Fe3GaTe2, Nano Letters 24, 7886 (2024).',
    doi: '10.1021/acs.nanolett.4c01019',
  },
  {
    id: 'evans2014',
    label: 'Evans 2014',
    citation:
      'R. F. L. Evans, W. J. Fan, P. Chureemart, et al., Atomistic spin model simulations of magnetic nanomaterials, J. Phys.: Condens. Matter 26, 103202 (2014).',
    doi: '10.1088/0953-8984/26/10/103202',
  },
  {
    id: 'huang2017',
    label: 'Huang 2017',
    citation:
      'B. Huang, G. Clark, E. Navarro-Moratalla, et al., Layer-dependent ferromagnetism in a van der Waals crystal down to the monolayer limit, Nature 546, 270 (2017).',
    doi: '10.1038/nature22391',
  },
];

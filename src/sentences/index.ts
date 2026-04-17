/**
 * Static registry of all sentence-encoder factories.
 *
 * Hand-written barrel rather than a runtime `readdirSync + require`
 * loop. TypeScript proves at compile time that every factory conforms
 * to `SentenceEncoderFactory`; the plugin also boots without a
 * filesystem scan. Before 2.x the plugin discovered encoders by
 * scanning the directory at startup — dropping a file into
 * `src/sentences/` was enough. **That is no longer the case**: an
 * encoder is registered only if it is imported here.
 *
 * When adding a new sentence:
 *   1. Create `./<SENTENCE>.ts` exporting the factory as the default:
 *      `export default function (app, plugin?) { return { ... } }`.
 *   2. Add the import + key below, preserving alphabetical order.
 *   3. Add tests under `test/<SENTENCE>.ts`. `test/registry.ts`
 *      asserts barrel/directory parity so a missing import fails CI.
 */

import type { SentenceEncoderFactory } from '../types/plugin'

import APB from './APB'
import APBtrue from './APB-true'
import DBK from './DBK'
import DBS from './DBS'
import DBT from './DBT'
import DPT from './DPT'
import DPTsurface from './DPT-surface'
import GGA from './GGA'
import GLL from './GLL'
import HDG from './HDG'
import HDM from './HDM'
import HDMC from './HDMC'
import HDT from './HDT'
import HDTC from './HDTC'
import MMB from './MMB'
import MTA from './MTA'
import MTW from './MTW'
import MWD from './MWD'
import MWVR from './MWVR'
import MWVT from './MWVT'
import PNKEP01 from './PNKEP01'
import PNKEP02 from './PNKEP02'
import PNKEP03 from './PNKEP03'
import PNKEP99 from './PNKEP99'
import PSILCD1 from './PSILCD1'
import PSILTBS from './PSILTBS'
import RMB from './RMB'
import RMC from './RMC'
import ROT from './ROT'
import RSA from './RSA'
import VHW from './VHW'
import VLW from './VLW'
import VPW from './VPW'
import VTG from './VTG'
import VWR from './VWR'
import VWT from './VWT'
import XDRBaro from './XDRBaro'
import XDRNA from './XDRNA'
import XDRTemp from './XDRTemp'
import XTE from './XTE'
import XTEGC from './XTE-GC'
import ZDA from './ZDA'

export const sentenceFactories: Readonly<
  Record<string, SentenceEncoderFactory>
> = {
  APB,
  'APB-true': APBtrue,
  DBK,
  DBS,
  DBT,
  DPT,
  'DPT-surface': DPTsurface,
  GGA,
  GLL,
  HDG,
  HDM,
  HDMC,
  HDT,
  HDTC,
  MMB,
  MTA,
  MTW,
  MWD,
  MWVR,
  MWVT,
  PNKEP01,
  PNKEP02,
  PNKEP03,
  PNKEP99,
  PSILCD1,
  PSILTBS,
  RMB,
  RMC,
  ROT,
  RSA,
  VHW,
  VLW,
  VPW,
  VTG,
  VWR,
  VWT,
  XDRBaro,
  XDRNA,
  XDRTemp,
  XTE,
  'XTE-GC': XTEGC,
  ZDA
}

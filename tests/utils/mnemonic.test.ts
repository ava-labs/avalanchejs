import Mnemonic from 'src/utils/mnemonic'
const randomBytes: any = require('randombytes')


import BN from 'bn.js'
import { Buffer } from 'buffer/'

const mnemonic = Mnemonic.getInstance()
const entropy: string = "9d7c99e77261acb88a5ed717f625d5d3ed5569e0f60429cc6eb9c4e91f48fb7c"
const langs: string[] = [
  "japanese",
  "spanish",
  "italian",
  "french",
  "korean",
  "czech",
  "portuguese",
  "chinese_traditional",
  "chinese_simplified"
]

const mnemnonics: string[] = [
  "ていし　みっか　せんせい　みっか　えいぶん　さつたば　かいよう　へんたい　うやまう　にちじょう　せっかく　とける　ぶどう　にんぷ　たいうん　はいそう　かえる　したて　なめらか　だじゃれ　だんれつ　てんぼうだい　もくようび　そむく",
  "nueve tenis lágrima tenis baile folleto canica sonoro autor perla jardín oxígeno sensor piscina lonja rabo cañón germen pegar marrón molino opuesto trébol llaga",
  "pergamena tensione maratona tensione becco geco cena srotolato badilata regola lumaca prelievo somma rifasare motivato sarcasmo ceramica ibernato randagio ninfa orafo polmonite tuffato modulo",
  "mobile surface héron surface batterie éthanol capsule serein bafouer pangolin gravir nuisible salive peintre intense préfixe carabine fatal orque label lucide neurone toucher informer",
  "운반 특별 시인 특별 귀신 빗물 농민 취업 구입 작년 스님 이윽고 체험 장애인 아흔 제작 농장 상추 입사 언덕 염려 의외로 학급 씨름",
  "pohnutka vize nikam vize datum ledvina export uklidnit cirkus revolver naslepo procento traverza rozjezd odliv slavnost fajfka lyra rande omluva panovat poukaz vyrvat ochladit",
  "mesada surdina guincho surdina aumentar escrita brilho sediado assador ostentar goela nevoeiro rouco panqueca inovador postal brochura faceta ontem judoca linhagem munido torque indeciso",
  "烯 逮 岩 逮 資 衛 走 賦 料 默 膠 辛 杯 挑 戶 陶 議 劉 拍 謀 浮 休 煩 慮",
  "烯 逮 岩 逮 资 卫 走 赋 料 默 胶 辛 杯 挑 户 陶 议 刘 拍 谋 浮 休 烦 虑"
]

const seeds: string[] = [
  "2ed50c99aa2ee350f0a46c8427d69f9f5c7c5864be7a64ae96695374a0a5a02a3c5075312234f05f8f4c840aa486c99131f84b81c56daff5c31a89cdc7b50424",
  "04c6cfd9337642f47e21e28632f9744fd1b56c57454ebae5c627c2a4b16e47c0948b9c582041bbb1590e128a25ae79d7055ed8aecdbc030920a67205da24846d",
  "c4274544eb6c375d2caa70af8c6a67e3b751c518cbb35244891c7b74a12a5e06d5ce5b925f134930e17f5e86b21146d096715c7645a250dbba1d2ba35bc07317",
  "00e5b5e4785763d6f92fe1ad7c5a7e7dd0fd375bd441473198d2486990ca5a924b5cb6b6831dc94d446c9b3180eefe2d799887bcfc1ee6d8f4f0650e594c9d1b",
  "d8dcc049712867ba7d1bc0e2874d8ec38ee26088d1e2affa10ffac30cf1d0b915bbb6c79bfafbb1db0e8cd66880bf4ba52c53b949f6a3adbba1821dd3045c7cb",
  "a81d8a917861cb8a1ffd2e94452e08fd6dc4d2577bad3ac089f56279521b1c95caebe57ac6c3d126d8abd4d6a3f2c3d8c207bd36fbf75a5e797c5a8f1992c651",
  "b9fc39d7f138a95b8f31436e02a8711b3164cd45a211673f7137429b45faf77a1604682b51803a983638c46a8b2c13237c87ab4b685a1fa5c65700dc7136ccfc",
  "1a5f3eab01276bf7d9b06c42be90fb4b8106b278b4bbaf922f3da6821a63b4d69fa9285fec0936e0f04a1b2a25a65064cd51c111c75063dbe59e4de336b35f85",
  "53bcb9fe403a4a45bee2a2a04dabfa3f2018db349d0e5200175bd345aaa3a3bd45a88a6fb7244914ad156961742f7b4ea7f8ffd83fcae5b1166b73b2ad943f76"
]

describe('Mnemonic', () => {
  const mnenmnic: string = "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"

  test('entropyToMnemonic', (): void => {
    langs.forEach((lang: string, index: number): void => {
      const wordlist = mnemonic.getWordlists(lang) as string[]
      const entropyToMnemonic: string = mnemonic.entropyToMnemonic(entropy, wordlist)
      expect(mnemnonics[index]).toBe(entropyToMnemonic)
    })
  })

  test('generateMnemonic', (): void => {
    const strength: number = 256
    langs.forEach((lang: string): void => {
      const wordlist = mnemonic.getWordlists(lang) as string[]
      const m: string = mnemonic.generateMnemonic(strength, randomBytes, wordlist)
      expect(typeof m === "string").toBeTruthy()
    })
  })

  test('getWordlists', (): void => {
    langs.forEach((lang: string): void => {
      const wordlist = mnemonic.getWordlists(lang) as string[]
      expect(typeof wordlist === "object").toBeTruthy()
    })
  })

  test('mnemonicToEntropy', (): void => {
    mnemnonics.forEach((mnemnnic: string, index: number): void => {
      const wordlist = mnemonic.getWordlists(langs[index]) as string[]
      const mnemonicToEntropy: string = mnemonic.mnemonicToEntropy(mnemnnic, wordlist)
      expect(mnemonicToEntropy).toBe(entropy)
    })
  })

  test('mnemonicToSeed', async (): Promise<void> => {
    mnemnonics.forEach(async (mnemnnic: string): Promise<any> => {
      const password: string = "password"
      const mnemonicToSeed: Buffer = await mnemonic.mnemonicToSeed(mnemnnic, password)
      expect(typeof mnemonicToSeed === "object").toBeTruthy()
    })
  })

  test('mnemonicToSeedSync', (): void => {
    mnemnonics.forEach((mnemnnic: string, index: number): void => {
      const password: string = "password"
      const mnemonicToSeedSync: Buffer = mnemonic.mnemonicToSeedSync(mnemnnic, password)
      expect(mnemonicToSeedSync.toString('hex')).toBe(seeds[index])
    })
  })

  test('validateMnemonic', (): void => {
    mnemnonics.forEach((mnemnnic: string, index: number): void => {
      const wordlist = mnemonic.getWordlists(langs[index]) as string[]
      const validateMnemonic: string = mnemonic.validateMnemonic(mnemnnic, wordlist)
      expect(validateMnemonic).toBeTruthy()
    })
  })

  test('setDefaultWordlist', (): void => {
    langs.forEach((lang: string, index: number): void => {
      mnemonic.setDefaultWordlist(lang)
      const getDefaultWordlist: string = mnemonic.getDefaultWordlist()
      const wordlist = mnemonic.getWordlists(lang) as string[]
      const m: string = mnemonic.generateMnemonic(256, randomBytes, wordlist)
      expect(getDefaultWordlist).toBe(lang)
      expect(typeof wordlist === "object").toBeTruthy()
      expect(typeof m === "string").toBeTruthy()
    })
  })
})

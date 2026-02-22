import React, { useState, useCallback, Suspense, lazy } from 'react'
import Home from './components/Home'

const Letters = lazy(() => import('./components/Letters'))
const Numbers = lazy(() => import('./components/Numbers'))
const Calming = lazy(() => import('./components/Calming'))
const Stories = lazy(() => import('./components/Stories'))
const BedtimeStory = lazy(() => import('./components/BedtimeStory'))
const PhonicsGame = lazy(() => import('./components/PhonicsGame'))
const MemoryGame = lazy(() => import('./components/MemoryGame'))
const BubbleGame = lazy(() => import('./components/BubbleGame'))
const FidgetSpinner = lazy(() => import('./components/FidgetSpinner'))
const MusicKeyboard = lazy(() => import('./components/MusicKeyboard'))
const Settings = lazy(() => import('./components/Settings'))
const Drawing = lazy(() => import('./components/Drawing'))
const FireFighter = lazy(() => import('./components/FireFighter'))
const AnimalSounds = lazy(() => import('./components/AnimalSounds'))
const ShapeSorter = lazy(() => import('./components/ShapeSorter'))
const ColorMixer = lazy(() => import('./components/ColorMixer'))
const CatchStars = lazy(() => import('./components/CatchStars'))
const StickerBook = lazy(() => import('./components/StickerBook'))
const FruitNinja = lazy(() => import('./components/FruitNinja'))

type Route = 'home'|'letters'|'numbers'|'calming'|'stories'|'bedtime'|'phonics'|'memory'|'bubble'|'fidget'|'music'|'settings'|'drawing'|'firefighter'|'animalsounds'|'shapesorter'|'colormixer'|'catchstars'|'stickerbook'|'fruitninja'

export default function App() {
  const [route, setRoute] = useState<Route>('home')
  const [pet, setPet] = useState('')

  const back = useCallback(() => setRoute('home'), [])
  const navigate = useCallback((r: string) => setRoute(r as Route), [])

  return (
    <div className="app">
      <main>
        <Suspense fallback={null}>
        {route === 'home' && <Home onNavigate={navigate} onPetChange={setPet} pet={pet} />}
        {route === 'letters' && <Letters onBack={back} pet={pet} />}
        {route === 'numbers' && <Numbers onBack={back} pet={pet} />}
        {route === 'calming' && <Calming onBack={back} pet={pet} />}
        {route === 'stories' && <Stories onBack={back} pet={pet} />}
        {route === 'bedtime' && <BedtimeStory onBack={back} />}
        {route === 'phonics' && <PhonicsGame onBack={back} pet={pet} />}
        {route === 'memory' && <MemoryGame onBack={back} pet={pet} />}
        {route === 'bubble' && <BubbleGame onBack={back} pet={pet} />}
        {route === 'fidget' && <FidgetSpinner onBack={back} pet={pet} />}
        {route === 'music' && <MusicKeyboard onBack={back} pet={pet} />}
        {route === 'settings' && <Settings onBack={back} pet={pet} />}
        {route === 'drawing' && <Drawing onBack={back} pet={pet} />}
        {route === 'firefighter' && <FireFighter onBack={back} pet={pet} />}
        {route === 'animalsounds' && <AnimalSounds onBack={back} pet={pet} />}
        {route === 'shapesorter' && <ShapeSorter onBack={back} pet={pet} />}
        {route === 'colormixer' && <ColorMixer onBack={back} pet={pet} />}
        {route === 'catchstars' && <CatchStars onBack={back} pet={pet} />}
        {route === 'stickerbook' && <StickerBook onBack={back} pet={pet} />}
        {route === 'fruitninja' && <FruitNinja onBack={back} pet={pet} />}
        </Suspense>
      </main>
      <footer className="nav">
        <button onClick={() => setRoute('home')}>🏠</button>
        <button onClick={() => setRoute('letters')}>🔤</button>
        <button onClick={() => setRoute('numbers')}>🔢</button>
        <button onClick={() => setRoute('phonics')}>🎮</button>
        <button onClick={() => setRoute('stories')}>📚</button>
        <button onClick={() => setRoute('calming')}>🌙</button>
        <button onClick={() => setRoute('drawing')}>🎨</button>
        <button onClick={() => setRoute('settings')}>⚙️</button>
      </footer>
    </div>
  )
}

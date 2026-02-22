import React, { useState } from 'react'
import Home from './components/Home'
import Letters from './components/Letters'
import Numbers from './components/Numbers'
import Calming from './components/Calming'
import Stories from './components/Stories'
import BedtimeStory from './components/BedtimeStory'
import PhonicsGame from './components/PhonicsGame'
import MemoryGame from './components/MemoryGame'
import BubbleGame from './components/BubbleGame'
import FidgetSpinner from './components/FidgetSpinner'
import MusicKeyboard from './components/MusicKeyboard'
import Settings from './components/Settings'
import Drawing from './components/Drawing'
import FireFighter from './components/FireFighter'
import AnimalSounds from './components/AnimalSounds'
import ShapeSorter from './components/ShapeSorter'
import ColorMixer from './components/ColorMixer'
import CatchStars from './components/CatchStars'
import PeekaBoo from './components/PeekaBoo'
import StickerBook from './components/StickerBook'

type Route = 'home'|'letters'|'numbers'|'calming'|'stories'|'bedtime'|'phonics'|'memory'|'bubble'|'fidget'|'music'|'settings'|'drawing'|'firefighter'|'animalsounds'|'shapesorter'|'colormixer'|'catchstars'|'peekaboo'|'stickerbook'

export default function App() {
  const [route, setRoute] = useState<Route>('home')
  const [pet, setPet] = useState('')

  const back = () => setRoute('home')

  return (
    <div className="app">
      <main>
        {route === 'home' && <Home onNavigate={(r: string) => setRoute(r as Route)} onPetChange={setPet} pet={pet} />}
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
        {route === 'peekaboo' && <PeekaBoo onBack={back} pet={pet} />}
        {route === 'stickerbook' && <StickerBook onBack={back} pet={pet} />}
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

import { useEffect, useRef } from 'react'
import { useImmerReducer } from 'use-immer'


function onlyUniqueBreeds(pics) {
  const uniqueBreeds = []
  const uniquePics = pics.filter(pic => {
    const breed = pic.split("/")[4]
    if (!uniqueBreeds.includes(breed) && !pic.includes(" ")) {
      uniqueBreeds.push(breed)
      return true
    }
  })
  return uniquePics.slice(0, Math.floor(uniquePics.length / 4) * 4)
}
const ourReducer = (draft, action) => {
  if (draft.points > draft.highScore) draft.highScore = draft.points


  switch (action.type) {
    case 'receiveHeighScore':
      draft.highScore = action.value
      if (!action.value) draft.highScore = 0;
      return
    case "decreaseTime":
      if (draft.timeRemaining <= 0) {
        draft.playing = false
      } else {
        draft.timeRemaining--
      }
      return
    case 'guessAttempt': {
      if (!draft.playing) return
      if (action.value === draft.currentQuestion.answer) {
        draft.points++
        draft.currentQuestion = generateQuestion()
      } else {
        draft.strikes++
        if (draft.strikes >= 3) {
          draft.playing = false
        }
      }
      return
    }
    case 'addToCollection':
      draft.bigCollection = draft.bigCollection.concat(action.value)
      return
    case 'startPlaying':
      draft.timeRemaining = 30
      draft.playing = true
      draft.points = 0
      draft.strikes = 0
      draft.currentQuestion = generateQuestion()
      return
  }

  function generateQuestion() {
    if (draft.bigCollection.length <= 12) {
      draft.fetchCount++
    }

    if (draft.currentQuestion) {
      draft.bigCollection = draft.bigCollection.slice(4, draft.bigCollection.length)
    }

    const randomTemp = Math.floor(Math.random() * 4)
    const justFour = draft.bigCollection.slice(0, 4)
    return {
      breed: justFour[randomTemp].split("/")[4],
      photos: justFour,
      answer: randomTemp
    }
  }
}

const initialState = {
  points: 0,
  strikes: 0,
  timeRemaining: 0,
  highScore: 0,
  bigCollection: [],
  currentQuestion: null,
  playing: false,
  fetchCount: 0
}

function HeartIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className={props.className} viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314" />
    </svg>
  )
}

function App() {
  const [state, dispatch] = useImmerReducer(ourReducer, initialState)
  const timerRef = useRef(null)

  useEffect(() => {
    if (state.highScore > 0) {
      localStorage.setItem("highscore", state.highScore)
    }
  }, [state.highScore])

  useEffect(() => {
    dispatch({ type: 'receiveHeighScore', value: localStorage.getItem('highscore') })
  }, [])


  useEffect(() => {
    if (state.bigCollection.length) {
      state.bigCollection.slice(0, 8).forEach(pic => {
        new Image().src = pic
      })
    }
  }, [state.bigCollection])


  useEffect(() => {
    if (state.playing) {
      console.log("interval created")
      timerRef.current = setInterval(() => {
        dispatch({ type: 'decreaseTime' })
      }, 1000)
      return () => {
        clearInterval(timerRef.current)
        console.log("interval cleared")
      }
    }
  }, [state.playing])

  useEffect(() => {
    const reqController = new AbortController()

    const getDogs = async () => {
      try {
        const picsPromise = await fetch('https://dog.ceo/api/breeds/image/random/50', { signal: reqController.signal })
        const pics = await picsPromise.json()
        const uniquePics = onlyUniqueBreeds(pics.message)
        dispatch({ type: "addToCollection", value: uniquePics })
      } catch {
        console.log("Our request was cancelled")
      }
    }
    getDogs()

    return () => {
      reqController.abort()
    }
  }, [state.fetchCount])

  return (
    <div>
      {state.currentQuestion && (
        <>
          <p className='text-center'>
            <span className='textzinc-400 mr-3'>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className={'inline-block ' + (state.playing ? 'animate-spin' : "")} viewBox="0 0 16 16">
                <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
                <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
              </svg>
              <span className='font-mono text-4xl relative top-2 ml-3'>0:{state.timeRemaining < 10 ? "0" + state.timeRemaining : state.timeRemaining}</span>
            </span>

            {[...Array(3 - state.strikes)].map((item, index) => {
              return <HeartIcon key={index} className="inline text-pink-600 mx-1" />
            })}
            {[...Array(state.strikes)].map((item, index) => {
              return <HeartIcon key={index} className="inline text-pink-200 mx-1" />
            })}
          </p>
          <h1 className='text-center font-bold pt-3 pb-10 break-all text-4 md:text-7xl sm:text-5xl'>{state.currentQuestion.breed}</h1>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-5 px-5'>
            {state.currentQuestion.photos.map((photo, index) => (
              <div onClick={() => dispatch({ type: 'guessAttempt', value: index })} key={index} className='rounded-lg h-40 lg:h-80 bg-cover bg-center' style={{ backgroundImage: `url(${photo})` }}>
              </div>
            ))}
          </div>
        </>
      )
      }
      {
        state.playing === false
        && Boolean(state.bigCollection.length)
        && !state.currentQuestion
        && (<p className='text-center fixed top-0 bottom-0 left-0 right-0 flex justify-center items-center'>
          <button
            onClick={() => dispatch({ type: 'startPlaying' })}
            className='text-white bg-gradient-to-b from-indigo-500 to-indigo-800 px-4 py-3 rounded text-2xl font-bold'>
            Play
          </button>
        </p>)
      }
      {(state.timeRemaining <= 0 || state.strikes >= 3) && state.currentQuestion && (
        <div className='fixed top-0 left-0 bottom-0 right-0 bg-black/90 text-white flex justify-center items-center text-center '>
          <div>
            {state.strikes >= 3 && <p className='text-6xl mb-4 font-bold'>3 Strikes: You're Out!</p>}
            {state.timeRemaining <= 0 && <p className='text-6xl mb-4 font-bold'>Time's Up! </p>}
            <p className='text-xl mb-1 mt-10'>You're Score: {" "}
              <span className='text-amber-400'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="inline-block relative bottom-1 mx-1" viewBox="0 0 16 16">
                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                </svg>
                {state.points}
              </span>
            </p>
            <p className='mb-7 text-xl'>Your Alltime High Score: {state.highScore}</p>
            <button
              onClick={() => dispatch({ type: 'startPlaying' })}
              className='text-white bg-gradient-to-b from-indigo-500 to-indigo-800 px-4 py-3 rounded text-lg font-bold'>
              Play again
            </button>

          </div>
        </div>
      )}
    </div >
  )
}

export default App

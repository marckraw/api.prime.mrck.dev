import { Hono } from 'hono'
import { config } from '../../../config.env'

const stravaRouter = new Hono()

interface StravaTokenResponse {
  token_type: string
  expires_at: number
  expires_in: number
  refresh_token: string
  access_token: string
  athlete: any
}


// This works, because we did one time approval, and the refresh token is stored in the env vars
// until someone else will use the app - not me, this is fine
async function getStravaAccessToken(): Promise<string> {
  try {
    if (config.STRAVA_REFRESH_TOKEN) {
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.STRAVA_CLIENT_ID,
          client_secret: config.STRAVA_CLIENT_SECRET,
          refresh_token: config.STRAVA_REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to refresh token')
      }

      const data: StravaTokenResponse = await tokenResponse.json()
      return data.access_token
    }
    
    throw new Error('No refresh token available')
  } catch (error) {
    console.error('Error refreshing Strava token:', error)
    throw new Error('Authentication failed - please reconnect your Strava account')
  }
}

// Get athlete's activities
stravaRouter.get('/activities', async (c) => {
  try {
    const accessToken = await getStravaAccessToken()
    
    const response = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=2',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Strava API error! status: ${response.status}`)
    }

    const activities = await response.json()
    return c.json({ activities })
  } catch (error: any) {
    console.error('Error fetching Strava activities:', error)
    return c.json({ 
      error: 'Failed to fetch activities', 
      details: error?.message || 'Unknown error'
    }, 500)
  }
})

// Get athlete profile
stravaRouter.get('/athlete', async (c) => {
  try {
    const accessToken = await getStravaAccessToken()
    
    const response = await fetch(
      'https://www.strava.com/api/v3/athlete',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const athlete = await response.json()
    return c.json({ athlete })
  } catch (error: any) { // Type assertion to handle unknown error type
    console.error('Error fetching Strava athlete:', error)
    return c.json({ 
      error: 'Failed to fetch athlete',
      details: error?.message || 'Unknown error'
    }, 500)
  }
})

export default stravaRouter 
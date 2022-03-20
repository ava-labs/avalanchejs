import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios"

function createRequest(config: AxiosRequestConfig): Request {
  const headers = new Headers(config.headers as Record<string, string>)

  if (config.auth) {
    const username = config.auth.username || ""
    const password = config.auth.password
      ? encodeURIComponent(config.auth.password)
      : ""
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
    )
  }

  const method = config.method.toUpperCase()
  const options: RequestInit = {
    headers: headers,
    method
  }
  if (method !== "GET" && method !== "HEAD") {
    options.body = config.data
  }

  if (!!config.withCredentials) {
    options.credentials = config.withCredentials ? "include" : "omit"
  }

  const fullPath = new URL(config.url, config.baseURL)
  const params = new URLSearchParams(config.params)

  const url = `${fullPath}${params}`

  return new Request(url, options)
}

async function getResponse(request, config): Promise<AxiosResponse> {
  let stageOne
  try {
    stageOne = await fetch(request)
  } catch (e) {
    const error: AxiosError = {
      ...new Error("Network Error"),
      config,
      request,
      isAxiosError: true,
      toJSON: () => error
    }
    return Promise.reject(error)
  }

  const response: AxiosResponse = {
    status: stageOne.status,
    statusText: stageOne.statusText,
    headers: { ...stageOne.headers }, // make a copy of the headers
    config: config,
    request,
    data: undefined // we set it below
  }

  if (stageOne.status >= 200 && stageOne.status !== 204) {
    switch (config.responseType) {
      case "arraybuffer":
        response.data = await stageOne.arrayBuffer()
        break
      case "blob":
        response.data = await stageOne.blob()
        break
      case "json":
        response.data = await stageOne.json()
        break
      case "formData":
        response.data = await stageOne.formData()
        break
      default:
        response.data = await stageOne.text()
        break
    }
  }

  return Promise.resolve(response)
}

export async function fetchAdapter(
  config: AxiosRequestConfig
): Promise<AxiosResponse> {
  const request = createRequest(config)

  const promiseChain = [getResponse(request, config)]

  if (config.timeout && config.timeout > 0) {
    promiseChain.push(
      new Promise((res, reject) => {
        setTimeout(() => {
          const message = config.timeoutErrorMessage
            ? config.timeoutErrorMessage
            : "timeout of " + config.timeout + "ms exceeded"
          const error: AxiosError = {
            ...new Error(message),
            config,
            request,
            code: "ECONNABORTED",
            isAxiosError: true,
            toJSON: () => error
          }
          reject(error)
        }, config.timeout)
      })
    )
  }

  const response = await Promise.race(promiseChain)
  return new Promise((resolve, reject) => {
    if (response instanceof Error) {
      reject(response)
    } else {
      if (
        !response.status ||
        !response.config.validateStatus ||
        response.config.validateStatus(response.status)
      ) {
        resolve(response)
      } else {
        const error: AxiosError = {
          ...new Error("Request failed with status code " + response.status),
          config,
          request,
          code: response.status >= 500 ? "ERR_BAD_RESPONSE" : "ERR_BAD_REQUEST",
          isAxiosError: true,
          toJSON: () => error
        }
        reject(error)
      }
    }
  })
}

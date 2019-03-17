import { call, put, select } from 'redux-saga/effects';

export const request = action => `${action}_REQUEST`;

export const success = action => `${action}_SUCCESS`;

export const failure = action => `${action}_FAILURE`;

export const FETCH_POST = 'POST';
export const FETCH_GET = 'GET';
export const FETCH_PUT = 'PUT';
export const FETCH_DELETE = 'DELETE';


const getHeader = (token = '', isFormData = false) => {
  const header = {
    Accept: 'application/json',
    Authorization: `JWT ${token}`,
  };
  if (!isFormData) {
    header['Content-Type'] = 'application/json';
  }
  return header;
};

const getOptionsGet = (token = '') => ({
  method: 'GET',
  headers: getHeader(token),
  mode: 'cors',
  cache: 'default',
});

const getOptionsPost = (body, token = '', isFormData = false) => {
  const data = {
    method: 'POST',
    headers: getHeader(token, isFormData),
    mode: 'cors',
    cache: 'default',
  };
  data.body = isFormData ? body : JSON.stringify(body);
  return data;
};

const getOptionsPut = (body, token = '', isFormData = false) => {
  const data = {
    method: 'PUT',
    headers: getHeader(token, isFormData),
    mode: 'cors',
    cache: 'default',
  };
  data.body = isFormData ? body : JSON.stringify(body);
  return data;
};

const getOptionsDelete = (token = '') => ({
  method: 'DELETE',
  headers: getHeader(token),
  mode: 'cors',
  cache: 'default',
});

export const fetchDataGet = (url, token = '') => fetch(url, getOptionsGet(token))
  .then(response => (response.status === 200
    ? response.json().then(data => data)
    : response.json().then(error => Promise.reject(error))));

export const fetchDataPost = (url, token = '', data = {}) => fetch(url, getOptionsPost(data, token, data))
  .then(response => (response.status === 200 || response.status === 201
    ? response.json().then(dataP => dataP)
    : response.json().then(error => Promise.reject(error))));

export const fetchDataPut = (url, token = '', data = {}) => fetch(url, getOptionsPut(data, token, data))
  .then(response => (response.status === 200 || response.status === 204 || response.status === 201
    ? response.json().then(dataP => dataP)
    : response.json().then(error => Promise.reject(error))));

export const fetchDataDelete = (url, token = '') => fetch(url, getOptionsDelete(token))
  .then(response => (response.status === 200 || response.status === 204
    ? ''
    : response.json().then(error => Promise.reject(error))));

function* fetchWithToken(action, token = '') {
  yield put({ type: request(action.type), meta: action.meta });
  try {
    let fetchFunction;

    if ('payload' in action) {
      fetchFunction = fetchDataPost;
    } else {
      fetchFunction = fetchDataGet;
    }

    if (action.meta.method === FETCH_POST) {
      fetchFunction = fetchDataPost;
    } else if (action.meta.method === FETCH_DELETE) {
      fetchFunction = fetchDataDelete;
    } else if (action.meta.method === FETCH_PUT) {
      fetchFunction = fetchDataPut;
    } else if (action.meta.method === FETCH_GET) {
      fetchFunction = fetchDataGet;
    }

    const payload = yield call(fetchFunction, action.meta.url, token, action.payload);
    yield put({ type: success(action.type), payload, meta: action.meta });
  } catch (error) {
    const payload = { error };
    yield put({ type: failure(action.type), payload, meta: action.meta });
  }
}

export function* fetchData(action) {
  yield fetchWithToken(action, '');
}

export function* fetchDataWithAuth(action, token = null) {
  const myToken = yield (token || select(state => state.login.token));
  yield fetchWithToken(action, myToken);
}

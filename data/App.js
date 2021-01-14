import React, { Component } from 'react'
import axios from 'axios'
import {inject as injectAxios,requestInterceptor,responseErrorInterceptor} from "../src/axios/interceptors"
import AppBody from './components/app-body.jsx'
import ButtonAppBar from './components/button-app-bar.jsx'
import './App.css';
import {resources} from 'mre-config-react/consts';
import userFactory from './components/UserFactory/userFactory';

import globalState from './lib/GlobalState'

const staticData = globalState.staticData


class App extends Component {

  state = {
    menuCollapsed: false
  }


  constructor (props) {

    function loadStaticData (dataSource, func) {
      if (!staticData[dataSource].length) {
        return axios.get(`/data/${dataSource}.json`)
        .then(response => {
          if (staticData[dataSource] && staticData[dataSource].length) {
            // Se já houver items em staticData[dataSource], o conteúdo
            // já foi carregado e não devemos acrescentar mais nada
            return
          }
          let data = func(response.data)
          // Temos que acrescentar os itens carregados ao array preexistente
          // staticData[dataSource], em lugar de simplesmente fazer
          // staticData[dataSource] = data, porque essa referência é passada 
          // na primeira chamada a SelectItemsField
          if (Array.isArray(data)) {
            data.forEach(item => staticData[dataSource].push(item))
            return;
          }

          return data          


        })
        .catch(error => {
          console.error(`Erro tentando obter ${dataSource}: ${error}`)
        })
      }
    }

    super(props)
    this.state = {
      content: ''
    }
    this.willRender = true;
    Object.keys(globalState.dataSources).forEach(dataSource => loadStaticData(dataSource, globalState.dataSources[dataSource]))

  }

  componentWillMount() {
    const user = userFactory(),
      isAuthenticated = Boolean(user.token);

      if (!isAuthenticated) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Token inválido. Redirecionando para o Cordilheira');
        }

        redirectToCordilheira();

        return this.willRender = false;
      }
  }

  handleCollapseMenu = collapse => {
    this.setState({menuCollapsed: collapse})
  }

  render() {
    if (!this.willRender) {
      return null;
    }
    return (
      <div className="App">
        <ButtonAppBar 
          menuCollapsed={this.state.menuCollapsed}
          onCollapseMenu={this.handleCollapseMenu}
        >
        </ButtonAppBar>
        <AppBody
          menuCollapsed={this.state.menuCollapsed}
        >
        </AppBody>
      </div>
    );
  }
}

export function inject(axios) {
  injectAxios(axios)
}

injectAxios(axios)

export function redirectToCordilheira() {
  const cordilheira = resources.cordilheira;
  window.location.href = cordilheira + 'autenticacao?redirectUrl=' + encodeURIComponent(window.location.href) ;
  return false;
}

export default App;
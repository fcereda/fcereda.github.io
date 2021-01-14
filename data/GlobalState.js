// import axios from 'axios'
import _ from 'lodash'
function processarUnidadesEPostos (data) {
  return data.grupo_unidade.map(row => {
    return {
      id: row.codigoUnidade,
      value: row.codigoUnidade,
      label: row.descricao,
	  nomeAbreviado: row.noPostoAbreviado,
	  dsPostoTratado: row.dsPostoTratado,
	  idUnidadeAdministrativa: row.idUnidadeAdministrativa,
	  dsTipoPosto: row.dsTipoPosto
    }
  }).sort((a, b) => a.label > b.label ? 1 : a.label < b.label ? -1 : 0)
}

// "codigoUnidade":"CDMBREM",
// "dsPostoTratado":"Abidj\u00e3 (E)",
// "dsTipoPosto":"Embaixada",
// "idGrupoUnidade":695,
// "descricao":"CDMBREM (Embaixada em Abidj\u00e3)",
// "noPostoAbreviado":"Brasemb Abidj\u00e3"

// const objGrupoPostos = {}

/**
 * Filtro para validação dos Grupos que são vinculados ao posto selecionado
 */
// function listarPostosGrupo () {
// 	return axios.get(`/data/postos_grupo.json`)
// 	.then(response => {
// 		let objGrupoPostos = []
// 		let postoSelecionado = JSON.parse(window.localStorage.getItem('ExpedWeb_estePosto'))
// 		let postosGrupo =  response.data.grupo_destinatario_posto.filter(postos => {
// 			return postos.coPosto == postoSelecionado.id 
// 		})
// 		for (var i = 0; i <= postosGrupo.length; i++) {
// 				var postoGrupo = postosGrupo[i];
// 				if ('undefined' === typeof postoGrupo) {
// 					continue;
// 				}
// 				var codigoGrupoPosto = postoGrupo.coGrupoDestinatario
// 				objGrupoPostos[codigoGrupoPosto] = postoGrupo
// 			}

// 		return objGrupoPostos
// 	})
// 	.catch(error => {
// 		console.error(`Erro tentando carregar postos_grupo.json: ${error}`)
// 	})
// }

// function listarGrupos () {
// 	return axios.get(`/data/postos_grupo.json`)
// 	.then(response => {
// 		console.log('Grupos', response)
// 	})
// 	.catch(error => {
// 		console.error(`Erro tentando carregar postos_grupo.json: ${error}`)
// 	})
// }

function GlobalState () {
	
	this.staticData = {
		unidades: [],
		postos: [],
		indexadores: [],
		baselegal: [],
		gruposcirctel: [],
		tipos: [
			{id: 'MG', label: 'Mensagem geral'},
			{id: 'MO', label: 'Mensagem operacional'},
			{id: 'ME', label: 'Mensagem executiva'}
		],

		prioridades: [
			{id: 'Normal', label: 'Normal', coPrioridade: 1},
			{id: 'Urgente', label: 'Urgente', coPrioridade: 2},
			{id: 'Urgentíssimo', label: 'Urgentíssimo', coPrioridade: 3}
		],

		carateres: [
			{id: 'Ostensivo', label: 'Ostensivo', idCarater: 1},
			// {id: 'Reservado', label: 'Reservado', idCarater: 2},
			// {id: 'Secreto', label: 'Secreto', idCarater: 3},
			// {id: 'Ultrassecreto', label: 'Ultrassecreto', idCarater: 4}
		],

		prazosSigilo: [
			{id: null, label: null},
			{id: '5', label: '5 anos'},
			{id: '15', label: '15 anos'},
			{id: '25', label: '25 anos'}
		]

	}

	this.setState = (newState) => {
		Object.keys(newState).forEach(key => {
			this[key] = {
				...this[key],
				...newState[key]
			}
		})
	}


	  /* ======================
	  Todas as tabelas de lookup são carregadas com base no objeto dataSources.
	  Cada chave desse objeto corresponde a uma chave no objeto staticData.
	  Cada valor é uma callback que será chamada com o argumento dos dados que foram
	  carregados pelo axios.get().
	  A callback deve retornar um array de objetos.
	  Cada objeto deve conter pelo menos três chaves: id, value e label
	  id e value são a mesma coisa (dependendo do componente, é usada a chave id ou value)
	  label é o texto da opção que é mostrado na tela para usuário
	  Note que o componente OutlinedSelect usa a chave 'id', enquanto os 
	  componentes SelectItemsField e Autocomplete usa a chave 'value' -- talvez fosse bom
	  uniformizar esses componentes oportunamente. 

	  Note também que o array staticData.indexadores é uma exceção, pois é mais complexo: 
	  agrupa os indexadores por grupos. Este formato permite que o componente SelectItemsField
	  organize os indexadores por grupo dentro do Select.
	  Para entender o comportamento dos componentes SelectedItemsField e Autocomplete,
	  veja a documentação da library react-select
	  =========================
	  */

	this.dataSources = {
		'unidades': processarUnidadesEPostos,
		'postos': processarUnidadesEPostos, 
		'indexadores': function (data) {
		  let grupos = ['Assuntos', 'Países e regiões', 'Organismos internacionais']
		  let indexadores = data.classificacao.map(indexador => {
		    return {
		      id: indexador.sigla,
		      value: indexador.sigla,
		      label: indexador.nameClassificacao,
			  grupo: indexador.tipoClassificacao,
			  idClassificacao: indexador.idClassificacao
		    }
		  })
		  let indexadoresAgrupados = grupos.map((grupo, index) => {
		    let codigoGrupo = index + 1
		    return {
		      label: grupo,
		      options: indexadores.filter(indexador => {
		        return indexador.grupo == codigoGrupo
		      }).sort((a, b) => {
		        if (a.value > b.value) return 1
		        if (a.value < b.value) return -1
		        return 0
		      })
		    }
		  })
		  return indexadoresAgrupados
		},
		'baselegal': function (data) {
		  let baselegal = data.BaseLegal.map(item => {
		    return {
		      value: item.cmpCoBaseLegal,
		      id: item.cmpCoBaseLegal,
		      label: item.cmpDcBaseLegal
		    }
		  })
		  return baselegal
		},
		'gruposcirctel': function(data) {
			let filterData = {}
			let gruposCirctel = data.grupo_destinatario.map((row) => {
				if (row.coGrupoDestinatario !== null) {
					filterData = {
						id: row.coGrupoDestinatario,
						value: row.coGrupoDestinatario,
						label: row.dcGrupoDestinatario,
					}
				}
				return filterData
			})
			return _.uniq(gruposCirctel, 'id')
		}
	}

	return this

}

let globalState = new GlobalState()

export default globalState
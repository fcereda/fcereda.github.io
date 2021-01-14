import FileSaver from 'file-saver'
import globalState from './GlobalState'
import Utils from './Utils'
import Consts from './Consts'
import Minuta from './Minuta'

import PDFMinuta from './pdf-minuta-v2'

function ArquivoMinuta(minuta, versoes) {
	this.tipoArquivo = 'MINUTA'
	this.versaoArquivo = '1.0'
	this.minuta = minuta
	this.versoes = versoes
	return this
}

function prepararArquivoExpedicao(minuta) {
	const campos = [{
		id: null,
		func: () => `De ${minuta.estePosto.nomeAbreviado} para Exteriores em ${Utils.getCurrentDateFormatted('DD/MM/YYYY')}\r\n`
	}, {
		id: 'CODI',
		func: () => ''
	}, {
		id: 'CARAT',
		func: () => minuta.sigilo
	}, {
		id: 'DEXP',
		func: () => {
			if (!minuta.prazoSigilo)
				return null
			let now = new Date()
			let prazo = new Date(now.getFullYear() + Number(minuta.prazoSigilo), now.getMonth(), now.getDate())
			return Utils.getDateFormatted(prazo, 'DD/MM/YYYY')
		}
	}, {
		id: 'BLEGIS',
		func: () => {
			if (!minuta.baseLegalSigilo)
				return null
			let baselegal = Utils.lookupLabel(minuta.baseLegalSigilo, globalState.staticData.baselegal)
			baselegal = baselegal.replace('Lei 12.527/2011 ', '')
			return baselegal
		}
	}, {
		id: 'PRIOR',
		func: () => minuta.prioridade
	}, {
		id: 'DISTR',
		func: () => minuta.distrib.split('/').map(res => { return res.trim() }).join('/')
	}, {
		id: 'DESCR',
		// func: () => minuta.classif.replace(/\s+/, "")
		func: () => minuta.classif.split('-').map(res => { return res.trim() }).join('-')
	}, {
		id: 'RTM',
		func: () => {
			if (!minuta.rtm)
				return null
			return minuta.rtm.map(posto => posto.value).join(',').toUpperCase()
		}
	}, {
		id: 'RTM/CLIC',
		func: () => {
			if (!minuta.rtmClic)
				return null
			return minuta.rtmClic.value
		}
	}, {
		id: 'REF/ADIT',
		func: () => {
			// OLD MATCH /(TEL|DESPTEL|DET|CIRCTEL|CIT)\s\d{1,6}\s\d{4}/g

			/**
			 * New Regex MAN-3787
			 * 
			 * Valida as iniciais ^(tel|desptel|det|circtel|cit)
			 * Valida os numeros do documento \s(\d{1,6})
			 * Valida o ano de referencia Opcional ([\s|\/][\d]{4}?)*$
			 * 
			 * ^(tel|desptel|det|circtel|cit)\s(\d{1,6})([\s|\/][\d]{4}?)*$
			 */

			let ref = minuta.ref,
				arrItem = [],
				date = new Date(),
				MATCHES = /(TEL|DESPTEL|DET|CIRCTEL|CIT)\s(\d{1,6})([\s|\/][\d]{4}?)*$/i
			if (!ref)
				return null
			ref = ref
				.toUpperCase()
				.replace(/DESPTEL/g, 'DET')
				.replace(/CIRCTEL/g, 'CIT')

			ref = ref.split(',').map(val => {
				arrItem = val.match(MATCHES)
				// arrItem = val.trim().replace('/', '').match(MATCHES)
				typeof arrItem[3] === 'undefined' ? arrItem[3] = ((arrItem[1] !== 'CIT') ? date.getFullYear() : '') : arrItem[3] = parseInt(arrItem[3].replace('/', ''))

				return arrItem.splice(1).join(' ').trim()
			})
			return ref.join(',')
		}
	}, {
		id: 'CATEG',
		func: () => minuta.tipo
	}, {
		id: null,
		func: () => `\r\n//\r\n${Utils.tratarIndice(minuta.indice)}\r\n//\r\n`
	}, {
		id: null,
		func: () => Object.keys(minuta.rtmClic).length > 0 ? `${minuta.rtmClic.description}` : ''
	}, {
		id: null,
		func: () => minuta.rtm.length > 0 ? `Retransmissão automática para ${Utils.textRetransmissao(minuta.rtm)} \r\n` : ''
	}, {
		id: 'RESUMO',
		func: () => {
			return `\r\n${Utils.linesResumo(minuta.resumo)}`
		}
	}, {
		id: null,
		func: () => {
			let strTexto = minuta.texto.replace(/(“|”)/g, '"')
			let texto = Utils.splitByWidth(strTexto, Consts.LARGURA_TEXTO).join('\r\n')
			let iniciais = (minuta.iniciais || '').toUpperCase()
			return `\r\n\r\n${texto}\r\n\r\n${iniciais}`
		}
	}]

	let linhas = campos.map(campo => {
		let linha = campo.id ? `${campo.id}=` : ''
		let conteudo = campo.func()
		if (conteudo) {
			linha = linha + conteudo
		}
		return linha
	})

	return linhas.join('\r\n')
}


function FileOperations() {
	this.carregarMinuta = (file) => {
		const reader = new FileReader()
		return new Promise((resolve, reject) => {
			reader.onload = function () {
				try {
					let data = this.result
					let arquivo
					try {
						arquivo = JSON.parse(data)
					} catch (error) {
						throw Error('O formato do arquivo é incorreto')
					}
					if (arquivo.tipoArquivo !== 'MINUTA') {
						throw Error('O formato do arquivo é inválido')
					}
					if (arquivo.versaoArquivo !== '1.0') {
						throw Error('Versão do arquivo incorreta')
					}
					let minuta = arquivo.minuta
					if (!minuta) {
						throw Error('O arquivo está corrompido')
					}
					resolve(new Minuta(minuta))
				} catch (error) {
					reject(error)
				}
			}
			reader.readAsText(file)
		})
	}

	this.salvarMinuta = (minuta, fileName) => {
		minuta.texto.replace(/(“|”)/g, '"')
		let fileContents = new ArquivoMinuta(minuta, minuta.versoes)

		if (!fileName) {
			fileName = `${minuta.iniciais || ('Minuta ' + minuta.classif + ' ') } ${Utils.getCurrentDateFormatted('YYYY-MM-DD hh-mm-ss')}`
			fileName += '.minuta'
		}
		let blob = new Blob([JSON.stringify(fileContents)], {
			type: 'text/plain',
			endings: 'native'
		})
		fileName = Utils.removeAccents(fileName)
		FileSaver.saveAs(blob, fileName)
	}

	this.salvarParaExpedicao = (minuta, fileName) => {
		let fileContents = prepararArquivoExpedicao(minuta)

		if (!fileName) {
			fileName = `Minuta para expedir ${Utils.getCurrentDateFormatted('YYYY-MM-DD hh-mm-ss')}.txt`
		}

		let uint8 = new Uint8Array(fileContents.length);
		/**
		 * Filtrando os as letras para converter para o padrão IS0-8859-1
		 */
		for (var i = 0; i < uint8.length; i++) {
			uint8[i] = fileContents.charCodeAt(i);
		}
		let blob = new Blob([uint8], {
			type: 'text/plain;charset=utf-8'
		});
		fileName = Utils.removeAccents(fileName)
		FileSaver.saveAs(blob, fileName)
	}

	// this.imprimirMinuta = (minuta) => {
	// 	PDFMinuta(minuta, (blob) => {
	// 		let filename = 'minuta.pdf'
	// 		FileSaver.saveAs(blob, filename)
	// 	})
	// }

	this.imprimirMinuta = (minuta, callback) => {
		this.iframe = null

		const downloadPDF = (blob) => {
			let filename = 'minuta.pdf'
			FileSaver.saveAs(blob, filename)
		}

		const printPDF = (blob) => {
			if (!this.iframe) {
				this.iframe = document.createElement('iframe')
				document.body.appendChild(this.iframe)
			}

			if (navigator.userAgent.indexOf("Firefox") != -1) {
				var a = document.createElement('a');
				var blob = new Blob([blob], {type: "application/pdf"}),
				url = window.URL.createObjectURL(blob);
				a.href = url;
				a.download = 'report.pdf';
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				this.iframe.onload = () => {
					setTimeout(() => {
						this.iframe.contentWindow.print()
						if (callback) {
							callback()
						}
					}, 100)
				}
				this.iframe.src = blob
			}

		}
		PDFMinuta(minuta, printPDF)
	}

}

let fileOperations = new FileOperations()

export default fileOperations

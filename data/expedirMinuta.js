expedirMinuta = () => {
      // let validacao;
      // if (this.props.minuta.tpDocumento === 'CIT') {
      //   validacao = MinutaCirctel.validarMinuta(this.props.minuta)
      // } else {
      //   validacao = Minuta.validarMinuta(this.props.minuta)
      // }
      // if (!validacao.ok) {
      //     this.setState({ 
      //       titleDialog: 'Minuta ainda não está pronta para expedição',
      //       dialogText: validacao.erro, 
      //       openDialog: true 
      //     })
      //     return
      // }

      let objExpedicao = {
          ...this.props.minuta,
          tpDocumento: this.props.minuta.tpDocumento,
          dsResumo: this.props.minuta.resumo.replace(/\n/g, '\r\n'),
          dsIndice: this.props.minuta.indice.replace(/\n/g, '\r\n'),
          dsSiglaNome: this.props.minuta.iniciais,
          dsTexto: this.props.minuta.texto.replace(/\n/g, '\r\n'),
          noCarater: this.props.minuta.sigilo,
          noPrioridade: this.props.minuta.prioridade,
          dsRetransmissao: this.props.minuta.tpDocumento === 'DET' ? this.props.minuta.arrSiglasDestinatarios : '',
          referencia: this.props.minuta.ref,
          idCategoria: 1,
          noLogin: this.props.minuta.dsNome,
          dsDestinatario: this.props.minuta.tpDocumento === 'DET' ? this.props.minuta.arrSiglasDestinatarios : this.props.minuta.arrSiglasDestinatariosCirctel,
          coPrazoBaseLegal: this.props.minuta.prazoSigilo,
      };
      delete objExpedicao.estePosto;
      delete objExpedicao.resumo;
      delete objExpedicao.dsNome;
      delete objExpedicao.iniciais;
      delete objExpedicao.indice;
      delete objExpedicao.texto;
      delete objExpedicao.sigilo;
      delete objExpedicao.prioridade;
      delete objExpedicao.rtm;
      delete objExpedicao.ref;
      delete objExpedicao.distrib;
      delete objExpedicao.tipo;
      delete objExpedicao.baseLegalSigilo;
      delete objExpedicao.rtmClic;
      delete objExpedicao.classif;
      delete objExpedicao.distrib;
      delete objExpedicao.tipo;
      delete this.props.minuta.arrSiglasDestinatarios;
      
      Resources('expedir').create(objExpedicao)
      .then(res => {
        // console.log('Response', res.status)
        if (res.status === 201 || res.status === 200) {
          this.setState({ openDialogExpedir: false })
          this.setState({
            snackbarMessage: 'Documento expedido com sucesso.',
            openSnackbar: true
          })
        }
      }).catch(error => {
        this.setState({
          snackbarMessage: 'Falha ao tentar expedir o documento.',
          openSnackbar: true
        })
        this.setState({ openDialogExpedir: false })
      throw error
      })
        
        // Resources('expedir').create(objExpedicao)
        //   .then(res => {
        //     if (res.status === 201 || res.status === 200) {
        //       this.setState({
        //         snackbarMessage: 'Documento expedido com sucesso.',
        //         openSnackbar: true
        //       })
        //     }
        //   }).catch(error => {
        //     this.setState({
        //       snackbarMessage: 'Falha ao tentar expedir o documento.',
        //       openSnackbar: true
        //     })
        //   throw error
        // })
       
        // this.salvarArquivo({
        //     callback: FileOperations.salvarParaExpedicao,   
        //     extensao: '.txt',
        //     mensagem: 'O arquivo para expedição foi salvo na pasta Downloads. Envie este arquivo para o Setor de Comunicações'
        // })
    }

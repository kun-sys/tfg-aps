import { Component, OnInit } from '@angular/core'
import { OfertaService } from 'src/app/services/oferta.service'
import { UsuarioService } from 'src/app/services/usuario.service'
import { Oferta } from '../../models/oferta.model'
import { UtilsService } from 'src/app/services/utils.service'
import { Profesor } from '../../models/profesor.model'
import { OfertaCrearGuard } from 'src/app/guards/oferta-crear.guard'
import { Router } from '@angular/router'
import { CUATRIMESTRE } from '../../models/cuatrimestre.model'
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.component.html',
  styleUrls: ['./ofertas.component.scss'],
})
export class OfertasComponent implements OnInit {

  public PROFESORES = Profesor
  public CUATRIMESTRES = CUATRIMESTRE
  public cuatrimestres = ['a', 'b', 'c']

  public dropdownSettings: IDropdownSettings = {};

  public offset = 0
  public limit = 50
  public paginaActual = 1

  public totalOfertas = 0
  public ofertas: Oferta[]

  public terminoBusqueda = ''
  public totalOfertasBuscadas = 0

  public cargando = false
  public cargandoTimeOut

  public filterProfesores = {}
  public filterAreaServicio = {}
  public filterCuatrimestre = [1, 2, 3]
  public filterCreador = ''
  public tags = []
  public tagInput = []; 


  public areasServicio: any;

  constructor(
    public ofertaCrearGuard: OfertaCrearGuard,
    public ofertaService: OfertaService,
    public usuarioService: UsuarioService,
    public utilsService: UtilsService,
    private router: Router,
  ) {
    if (this.router.url === '/mis-ofertas') {
      this.filterCreador = this.usuarioService.usuario.uid
    }
  }

  prevPage(): void {
    const newOffset = this.offset - this.limit
    this.offset = newOffset < 0 ? 0 : newOffset
  }

  nextPage(): void {
    const newOffset = this.offset + this.limit
    this.offset = newOffset >= this.totalOfertas ? this.offset : newOffset
  }

  get firstPageRecord(): number {
    const minResults = Math.min(this.totalOfertas, this.totalOfertasBuscadas)
    return minResults === 0 ? 0 : this.offset + 1
  }

  get lastPageRecord(): number {
    return this.totalOfertas
  }

  ngOnInit(): void {
    this.cargarOfertas()
    this.obtenerAreasServicio();
    this.dropdownSettings = {
      singleSelection: true,
      idField: 'id',
      textField: 'nombre',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 10,
      allowSearchFilter: true,
    };
  }

  onItemSelectedArea(item: any){
    console.log("Item: " + item.nombre);
  }

  cambiarPagina(): void {
    this.cargarOfertas()
  }

  getFiltros() {
    return {
      terminoBusqueda: this.terminoBusqueda,
      profesores: this.filterProfesores,
      cuatrimestre: this.filterCuatrimestre.map((v, index, array) =>
        v ? index + 1 : 0,
      ),
      areaServicio: this.filterAreaServicio,
      creador: this.filterCreador,
      tags: this.tagInput.map(x => x.value),
    }
  }

  cargarOfertas(): void {
    this.ofertaService
      .cargarOfertas(this.offset, this.limit, this.getFiltros())
      .subscribe(({ total, filtradas, ofertas }) => {
        this.totalOfertas = total.valueOf()
        this.totalOfertasBuscadas = filtradas.valueOf()
        this.ofertas = ofertas
        this.cargando = false
      })
  }
 
  async computePossibleTags($event) {
    this.utilsService
      .computePossibleTags($event.target.value)
      .subscribe((resp: any) => {
        this.tags = resp.tags.map(function (x) {
          return x['nombre']
        })
      })
  }

  async obtenerAreasServicio(){
    return this.ofertaService.obtenerAreasServicio().subscribe((resp: any)=>{
      this.areasServicio = resp.areasServicio;
      return this.areasServicio;
    });
  }
}

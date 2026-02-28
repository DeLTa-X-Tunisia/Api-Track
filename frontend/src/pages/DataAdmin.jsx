import { useState, useEffect } from 'react';
import { 
  Search, Database, Calendar, Clock, Edit3, Save, X, 
  ChevronDown, ChevronRight, FileText, AlertCircle, 
  Package, Layers, Cylinder, History, CheckCircle
} from 'lucide-react';
import { adminDataApi } from '../services/api';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16); // Format for datetime-local input
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DataAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchResults, setSearchResults] = useState({ bobines: [], lots: [], tubes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Selected item for editing
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState(null); // 'bobine', 'lot', 'tube', 'etape', 'historique'
  const [editData, setEditData] = useState({});
  const [motif, setMotif] = useState('');
  const [saving, setSaving] = useState(false);

  // Corrections log
  const [showLog, setShowLog] = useState(false);
  const [corrections, setCorrections] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [loadingLog, setLoadingLog] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    bobines: true,
    lots: true,
    tubes: true,
    etapes: true,
    historique: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSelectedItem(null);
    setItemDetails(null);
    
    try {
      const res = await adminDataApi.search(searchQuery, searchType);
      setSearchResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Load item details
  const loadItemDetails = async (type, id) => {
    setLoadingDetails(true);
    setSelectedType(type);
    setSelectedItem(id);
    setItemDetails(null);
    setEditMode(null);
    
    try {
      let res;
      if (type === 'bobines') res = await adminDataApi.getBobine(id);
      else if (type === 'lots') res = await adminDataApi.getLot(id);
      else if (type === 'tubes') res = await adminDataApi.getTube(id);
      setItemDetails(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Start editing
  const startEdit = (type, data) => {
    setEditMode(type);
    setEditData({ ...data });
    setMotif('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditMode(null);
    setEditData({});
    setMotif('');
  };

  // Save changes
  const saveChanges = async () => {
    if (!motif.trim()) {
      setError('Le motif de correction est obligatoire');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let payload = { motif };

      switch (editMode) {
        case 'bobine':
          payload.date_reception = editData.date_reception;
          await adminDataApi.updateBobineDates(itemDetails.id, payload);
          break;
        case 'lot':
          payload.date_creation = editData.date_creation;
          payload.date_fin = editData.date_fin || null;
          await adminDataApi.updateLotDates(itemDetails.id, payload);
          break;
        case 'tube':
          payload.date_creation = editData.date_creation;
          payload.date_fin = editData.date_fin || null;
          await adminDataApi.updateTubeDates(itemDetails.id, payload);
          break;
        case 'etape':
          payload.date_debut = editData.date_debut;
          payload.date_fin = editData.date_fin || null;
          await adminDataApi.updateEtapeDates(editData.id, payload);
          break;
        case 'historique':
          payload.date_entree = editData.date_entree;
          payload.date_sortie = editData.date_sortie || null;
          await adminDataApi.updateHistoriqueDates(editData.id, payload);
          break;
        default:
          throw new Error('Type de modification inconnu');
      }
      
      setSuccess('Modification enregistrée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reload details
      if (selectedType && selectedItem) {
        loadItemDetails(selectedType, selectedItem);
      }
      
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Load corrections log
  const loadCorrectionsLog = async (page = 1) => {
    setLoadingLog(true);
    try {
      const res = await adminDataApi.getCorrectionsLog(page, 20);
      setCorrections(res.data.logs);
      setLogTotal(res.data.total);
      setLogPage(page);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du journal');
    } finally {
      setLoadingLog(false);
    }
  };

  // Toggle log view
  const toggleLogView = () => {
    if (!showLog) {
      loadCorrectionsLog(1);
    }
    setShowLog(!showLog);
  };

  const ResultCard = ({ type, item, icon: Icon }) => (
    <div 
      className={`p-3 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        selectedItem === item.id && selectedType === type 
          ? 'border-blue-500 ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => loadItemDetails(type, item.id)}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900">{item.numero}</span>
        <span className={`ml-auto px-2 py-0.5 text-xs rounded-full ${
          item.statut === 'termine' ? 'bg-green-100 text-green-700' :
          item.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
          item.statut === 'rebut' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {item.statut}
        </span>
      </div>
      {item.bobine_numero && (
        <div className="text-xs text-gray-500 mt-1">Bobine: {item.bobine_numero}</div>
      )}
      {item.lot_numero && (
        <div className="text-xs text-gray-500 mt-1">Lot: {item.lot_numero}</div>
      )}
    </div>
  );

  const DateField = ({ label, value, editKey, disabled = false }) => {
    const isEditing = editMode && editData[editKey] !== undefined;
    
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="w-32 text-sm text-gray-600">{label}:</div>
        {isEditing ? (
          <input
            type="datetime-local"
            value={formatDateTime(editData[editKey])}
            onChange={(e) => setEditData(prev => ({ ...prev, [editKey]: e.target.value }))}
            className="flex-1 px-3 py-1.5 border border-blue-300 rounded focus:ring-2 focus:ring-blue-200 focus:outline-none"
            disabled={disabled}
          />
        ) : (
          <span className="flex-1 text-gray-900">{formatDisplayDate(value)}</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administration des Données</h1>
              <p className="text-sm text-gray-500">Correction des dates du pipeline (System Admin)</p>
            </div>
          </div>
          <button
            onClick={toggleLogView}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showLog 
                ? 'bg-purple-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            Journal des corrections
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {showLog ? (
          /* Corrections Log View */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Journal des Corrections</h2>
            
            {loadingLog ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : corrections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Aucune correction enregistrée</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Table</th>
                        <th className="px-3 py-2 text-left">Référence</th>
                        <th className="px-3 py-2 text-left">Champ</th>
                        <th className="px-3 py-2 text-left">Ancienne valeur</th>
                        <th className="px-3 py-2 text-left">Nouvelle valeur</th>
                        <th className="px-3 py-2 text-left">Motif</th>
                        <th className="px-3 py-2 text-left">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {corrections.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDisplayDate(log.created_at)}
                          </td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              {log.table_modifiee}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-medium">{log.enregistrement_ref}</td>
                          <td className="px-3 py-2">{log.champ_modifie}</td>
                          <td className="px-3 py-2 text-red-600">
                            {log.ancienne_valeur ? formatDisplayDate(log.ancienne_valeur) : '-'}
                          </td>
                          <td className="px-3 py-2 text-green-600">
                            {log.nouvelle_valeur ? formatDisplayDate(log.nouvelle_valeur) : '-'}
                          </td>
                          <td className="px-3 py-2 max-w-xs truncate" title={log.motif}>
                            {log.motif}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {log.admin_prenom} {log.admin_nom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {logTotal} correction{logTotal > 1 ? 's' : ''} au total
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadCorrectionsLog(logPage - 1)}
                      disabled={logPage <= 1}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <span className="px-3 py-1">Page {logPage}</span>
                    <button
                      onClick={() => loadCorrectionsLog(logPage + 1)}
                      disabled={corrections.length < 20}
                      className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Main View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Recherche
                </h2>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Numéro de bobine, lot ou tube..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">Tous les types</option>
                      <option value="bobines">Bobines</option>
                      <option value="lots">Lots</option>
                      <option value="tubes">Tubes</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery.trim()}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>Recherche...</>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Rechercher
                      </>
                    )}
                  </button>
                </div>

                {/* Search Results */}
                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Bobines */}
                  {searchResults.bobines.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleSection('bobines')}
                        className="flex items-center gap-2 w-full text-left font-medium text-gray-700 mb-2"
                      >
                        {expandedSections.bobines ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Package className="w-4 h-4" />
                        Bobines ({searchResults.bobines.length})
                      </button>
                      {expandedSections.bobines && (
                        <div className="space-y-2">
                          {searchResults.bobines.map((b) => (
                            <ResultCard key={b.id} type="bobines" item={b} icon={Package} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lots */}
                  {searchResults.lots.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleSection('lots')}
                        className="flex items-center gap-2 w-full text-left font-medium text-gray-700 mb-2"
                      >
                        {expandedSections.lots ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Layers className="w-4 h-4" />
                        Lots ({searchResults.lots.length})
                      </button>
                      {expandedSections.lots && (
                        <div className="space-y-2">
                          {searchResults.lots.map((l) => (
                            <ResultCard key={l.id} type="lots" item={l} icon={Layers} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tubes */}
                  {searchResults.tubes.length > 0 && (
                    <div>
                      <button
                        onClick={() => toggleSection('tubes')}
                        className="flex items-center gap-2 w-full text-left font-medium text-gray-700 mb-2"
                      >
                        {expandedSections.tubes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Cylinder className="w-4 h-4" />
                        Tubes ({searchResults.tubes.length})
                      </button>
                      {expandedSections.tubes && (
                        <div className="space-y-2">
                          {searchResults.tubes.map((t) => (
                            <ResultCard key={t.id} type="tubes" item={t} icon={Cylinder} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {searchResults.bobines.length === 0 && 
                   searchResults.lots.length === 0 && 
                   searchResults.tubes.length === 0 && 
                   searchQuery && !loading && (
                    <div className="text-center py-4 text-gray-500">
                      Aucun résultat trouvé
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                {!selectedItem ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-16">
                    <Database className="w-16 h-16 mb-4 opacity-30" />
                    <p>Sélectionnez un élément pour voir ses détails</p>
                  </div>
                ) : loadingDetails ? (
                  <div className="flex items-center justify-center h-full py-16">
                    <div className="text-gray-500">Chargement des détails...</div>
                  </div>
                ) : itemDetails ? (
                  <div className="space-y-6">
                    {/* Bobine Details */}
                    {selectedType === 'bobines' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Bobine: {itemDetails.numero}
                          </h3>
                          {editMode !== 'bobine' ? (
                            <button
                              onClick={() => startEdit('bobine', { date_reception: itemDetails.date_reception })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
                              <Edit3 className="w-4 h-4" />
                              Modifier
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                <X className="w-4 h-4" />
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <DateField 
                            label="Date réception" 
                            value={itemDetails.date_reception} 
                            editKey="date_reception" 
                          />
                        </div>

                        {editMode === 'bobine' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-yellow-800 mb-2">
                              Motif de la correction (obligatoire)
                            </label>
                            <textarea
                              value={motif}
                              onChange={(e) => setMotif(e.target.value)}
                              placeholder="Expliquez la raison de cette correction..."
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-200 focus:outline-none"
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          <div>Statut: <span className="font-medium">{itemDetails.statut}</span></div>
                          <div>Nuance acier: <span className="font-medium">{itemDetails.nuance_acier || '-'}</span></div>
                          <div>Fournisseur: <span className="font-medium">{itemDetails.fournisseur || '-'}</span></div>
                        </div>
                      </>
                    )}

                    {/* Lot Details */}
                    {selectedType === 'lots' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Layers className="w-5 h-5 text-purple-600" />
                            Lot: {itemDetails.numero}
                          </h3>
                          {editMode !== 'lot' ? (
                            <button
                              onClick={() => startEdit('lot', { 
                                date_creation: itemDetails.date_creation,
                                date_fin: itemDetails.date_fin
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                            >
                              <Edit3 className="w-4 h-4" />
                              Modifier
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                <X className="w-4 h-4" />
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                          <DateField 
                            label="Date création" 
                            value={itemDetails.date_creation} 
                            editKey="date_creation" 
                          />
                          <DateField 
                            label="Date fin" 
                            value={itemDetails.date_fin} 
                            editKey="date_fin" 
                          />
                        </div>

                        {editMode === 'lot' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-yellow-800 mb-2">
                              Motif de la correction (obligatoire)
                            </label>
                            <textarea
                              value={motif}
                              onChange={(e) => setMotif(e.target.value)}
                              placeholder="Expliquez la raison de cette correction..."
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-200 focus:outline-none"
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="text-sm text-gray-500">
                          <div>Bobine: <span className="font-medium">{itemDetails.bobine_numero}</span></div>
                          <div>Statut: <span className="font-medium">{itemDetails.statut}</span></div>
                        </div>
                      </>
                    )}

                    {/* Tube Details */}
                    {selectedType === 'tubes' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Cylinder className="w-5 h-5 text-orange-600" />
                            Tube: {itemDetails.numero}
                          </h3>
                          {editMode !== 'tube' ? (
                            <button
                              onClick={() => startEdit('tube', { 
                                date_creation: itemDetails.date_creation,
                                date_fin: itemDetails.date_fin
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                            >
                              <Edit3 className="w-4 h-4" />
                              Modifier dates tube
                            </button>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={saveChanges}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                              >
                                <X className="w-4 h-4" />
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                          <DateField 
                            label="Date création" 
                            value={itemDetails.date_creation} 
                            editKey="date_creation" 
                          />
                          <DateField 
                            label="Date fin" 
                            value={itemDetails.date_fin} 
                            editKey="date_fin" 
                          />
                        </div>

                        {editMode === 'tube' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <label className="block text-sm font-medium text-yellow-800 mb-2">
                              Motif de la correction (obligatoire)
                            </label>
                            <textarea
                              value={motif}
                              onChange={(e) => setMotif(e.target.value)}
                              placeholder="Expliquez la raison de cette correction..."
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-200 focus:outline-none"
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="text-sm text-gray-500 mb-4">
                          <div>Bobine: <span className="font-medium">{itemDetails.bobine_numero}</span></div>
                          <div>Lot: <span className="font-medium">{itemDetails.lot_numero}</span></div>
                          <div>Statut: <span className="font-medium">{itemDetails.statut}</span></div>
                          <div>Décision: <span className="font-medium">{itemDetails.decision || '-'}</span></div>
                        </div>

                        {/* Etapes du tube */}
                        {itemDetails.etapes && itemDetails.etapes.length > 0 && (
                          <div className="border-t pt-4">
                            <button
                              onClick={() => toggleSection('etapes')}
                              className="flex items-center gap-2 w-full text-left font-medium text-gray-700 mb-3"
                            >
                              {expandedSections.etapes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <Calendar className="w-4 h-4" />
                              Étapes ({itemDetails.etapes.length})
                            </button>
                            
                            {expandedSections.etapes && (
                              <div className="space-y-2">
                                {itemDetails.etapes.map((etape) => (
                                  <div key={etape.id} className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-blue-900">
                                        {etape.etape_nom} ({etape.etape_code})
                                      </span>
                                      {editMode === 'etape' && editData.id === etape.id ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={saveChanges}
                                            disabled={saving}
                                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                          >
                                            {saving ? '...' : 'Sauver'}
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => startEdit('etape', {
                                            id: etape.id,
                                            date_debut: etape.date_debut,
                                            date_fin: etape.date_fin
                                          })}
                                          className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded hover:bg-blue-200"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    {editMode === 'etape' && editData.id === etape.id ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <label className="text-xs text-gray-600">Début:</label>
                                            <input
                                              type="datetime-local"
                                              value={formatDateTime(editData.date_debut)}
                                              onChange={(e) => setEditData(prev => ({ ...prev, date_debut: e.target.value }))}
                                              className="w-full px-2 py-1 border rounded text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Fin:</label>
                                            <input
                                              type="datetime-local"
                                              value={formatDateTime(editData.date_fin)}
                                              onChange={(e) => setEditData(prev => ({ ...prev, date_fin: e.target.value }))}
                                              className="w-full px-2 py-1 border rounded text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-2">
                                          <input
                                            type="text"
                                            value={motif}
                                            onChange={(e) => setMotif(e.target.value)}
                                            placeholder="Motif de correction..."
                                            className="w-full px-2 py-1 border border-yellow-300 rounded text-xs bg-yellow-50"
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div>Début: {formatDisplayDate(etape.date_debut)}</div>
                                        <div>Fin: {formatDisplayDate(etape.date_fin)}</div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Historique du tube */}
                        {itemDetails.historique && itemDetails.historique.length > 0 && (
                          <div className="border-t pt-4">
                            <button
                              onClick={() => toggleSection('historique')}
                              className="flex items-center gap-2 w-full text-left font-medium text-gray-700 mb-3"
                            >
                              {expandedSections.historique ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <History className="w-4 h-4" />
                              Historique ({itemDetails.historique.length})
                            </button>
                            
                            {expandedSections.historique && (
                              <div className="space-y-2">
                                {itemDetails.historique.map((hist) => (
                                  <div key={hist.id} className="bg-purple-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-purple-900">
                                        {hist.etape_nom} ({hist.etape_code})
                                      </span>
                                      {editMode === 'historique' && editData.id === hist.id ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={saveChanges}
                                            disabled={saving}
                                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                          >
                                            {saving ? '...' : 'Sauver'}
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                          >
                                            Annuler
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => startEdit('historique', {
                                            id: hist.id,
                                            date_entree: hist.date_entree,
                                            date_sortie: hist.date_sortie
                                          })}
                                          className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded hover:bg-purple-200"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    {editMode === 'historique' && editData.id === hist.id ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div>
                                            <label className="text-xs text-gray-600">Entrée:</label>
                                            <input
                                              type="datetime-local"
                                              value={formatDateTime(editData.date_entree)}
                                              onChange={(e) => setEditData(prev => ({ ...prev, date_entree: e.target.value }))}
                                              className="w-full px-2 py-1 border rounded text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-600">Sortie:</label>
                                            <input
                                              type="datetime-local"
                                              value={formatDateTime(editData.date_sortie)}
                                              onChange={(e) => setEditData(prev => ({ ...prev, date_sortie: e.target.value }))}
                                              className="w-full px-2 py-1 border rounded text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-2">
                                          <input
                                            type="text"
                                            value={motif}
                                            onChange={(e) => setMotif(e.target.value)}
                                            placeholder="Motif de correction..."
                                            className="w-full px-2 py-1 border border-yellow-300 rounded text-xs bg-yellow-50"
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div>Entrée: {formatDisplayDate(hist.date_entree)}</div>
                                        <div>Sortie: {formatDisplayDate(hist.date_sortie)}</div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataAdmin;

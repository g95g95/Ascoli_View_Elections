import { StatCard } from '../../components/ui/StatCard';
import { Header } from '../../components/layout/Header';
import type { ElectionData } from '../../lib/dataLoader';

interface DashboardProps {
  electionData: ElectionData;
}

export function Dashboard({ electionData }: DashboardProps) {
  const { config, ballottaggio, liste, preferenze, votanti } = electionData;

  // Calculate stats based on available data
  const totalCandidates = preferenze
    ? preferenze.liste.reduce((sum, party) => sum + party.candidati.length, 0)
    : 0;

  const totalListe = liste?.liste.length || preferenze?.liste.length || 0;

  // For elections with ballottaggio (comunali)
  if (ballottaggio) {
    const hasAffluenza = ballottaggio.affluenza &&
      typeof ballottaggio.affluenza.votanti_donne === 'number' &&
      typeof ballottaggio.affluenza.votanti_uomini === 'number';
    const totalVoters = hasAffluenza
      ? ballottaggio.affluenza.votanti_donne + ballottaggio.affluenza.votanti_uomini
      : ballottaggio.candidati.reduce((s, c) => s + c.totale, 0);
    const totalEligible = hasAffluenza
      ? ballottaggio.affluenza.aventi_diritto_donne + ballottaggio.affluenza.aventi_diritto_uomini
      : 0;
    const turnout = totalEligible > 0 ? ((totalVoters / totalEligible) * 100).toFixed(1) : null;
    const winner = ballottaggio.candidati.reduce((a, b) => (a.totale > b.totale ? a : b));

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <Header title={config.label} subtitle={`Ascoli Piceno - ${ballottaggio.data}`} />
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard
              title="Sindaco Eletto"
              value={winner.nome}
              subtitle={`${winner.totale.toLocaleString('it-IT')} voti`}
              icon="👑"
              color="green"
            />
            <StatCard
              title={turnout ? "Affluenza" : "Voti Totali"}
              value={turnout ? `${turnout}%` : totalVoters.toLocaleString('it-IT')}
              subtitle={turnout ? `${totalVoters.toLocaleString('it-IT')} votanti` : "voti espressi"}
              icon="📈"
              color="blue"
            />
            <StatCard
              title="Liste"
              value={totalListe}
              subtitle="partecipanti"
              icon="📋"
              color="amber"
            />
            <StatCard
              title="Candidati"
              value={totalCandidates}
              subtitle="consiglieri"
              icon="👥"
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Ballottaggio Sindaco</h3>
              <div className="space-y-4">
                {ballottaggio.candidati.map((candidate, idx) => {
                  const total = ballottaggio.candidati.reduce((s, c) => s + c.totale, 0);
                  const percentage = ((candidate.totale / total) * 100).toFixed(1);
                  return (
                    <div key={candidate.nome}>
                      <div className="flex justify-between mb-1 text-sm md:text-base">
                        <span className="font-medium">{candidate.nome}</span>
                        <span className="text-gray-600">
                          {candidate.totale.toLocaleString('it-IT')} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${idx === 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {hasAffluenza ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Affluenza</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-blue-700">
                      {ballottaggio.affluenza.aventi_diritto_uomini.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-blue-600">Aventi Diritto U</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-pink-700">
                      {ballottaggio.affluenza.aventi_diritto_donne.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-pink-600">Aventi Diritto D</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-gray-700">
                      {ballottaggio.affluenza.schede_bianche.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Schede Bianche</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-red-700">
                      {ballottaggio.affluenza.schede_nulle.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-red-600">Schede Nulle</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Dettagli Voto</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ballottaggio.candidati.map((c, idx) => (
                    <div key={c.nome} className={`text-center p-3 rounded-lg ${idx === 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                      <div className={`text-xl md:text-2xl font-bold ${idx === 0 ? 'text-blue-700' : 'text-red-700'}`}>
                        {c.totale.toLocaleString('it-IT')}
                      </div>
                      <div className={`text-xs md:text-sm ${idx === 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {c.nome.split(' ').slice(-1)[0]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center text-sm text-gray-500">
                  {(ballottaggio as unknown as { sezioni_scrutinate?: number }).sezioni_scrutinate || Object.keys((ballottaggio.candidati[0] as unknown as { sezioni?: Record<string, number> })?.sezioni || {}).length} sezioni scrutinate
                </div>
              </div>
            )}
          </div>

          {liste && (
            <div className="mt-4 md:mt-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 Liste</h3>
              <div className="space-y-2">
                {[...liste.liste]
                  .sort((a, b) => b.totale - a.totale)
                  .slice(0, 10)
                  .map((lista, idx) => {
                    const total = liste.liste.reduce((s, l) => s + l.totale, 0);
                    const pct = ((lista.totale / total) * 100).toFixed(1);
                    return (
                      <div key={lista.nome} className="flex items-center gap-2 text-sm">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                          {idx + 1}
                        </span>
                        <span className="flex-1 truncate">{lista.nome}</span>
                        <span className="font-medium">{lista.totale.toLocaleString('it-IT')}</span>
                        <span className="text-gray-500 w-16 text-right">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For elections with liste (europee) or preferences-only (regionali)
  if (liste) {
    const totalVotes = liste.liste.reduce((s, l) => s + l.totale, 0);
    const winnerParty = [...liste.liste].sort((a, b) => b.totale - a.totale)[0];

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <Header title={config.label} subtitle={`Ascoli Piceno - ${liste.data}`} />
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard
              title="Prima Lista"
              value={winnerParty.nome}
              subtitle={`${winnerParty.totale.toLocaleString('it-IT')} voti`}
              icon="🏆"
              color="green"
            />
            <StatCard
              title="Voti Totali"
              value={totalVotes.toLocaleString('it-IT')}
              subtitle="voti validi"
              icon="📈"
              color="blue"
            />
            <StatCard
              title="Liste"
              value={liste.liste.length}
              subtitle="partecipanti"
              icon="📋"
              color="amber"
            />
            <StatCard
              title="Candidati"
              value={totalCandidates}
              subtitle="candidati"
              icon="👥"
              color="purple"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-lg font-semibold mb-4">Risultati Liste</h3>
            <div className="space-y-3">
              {[...liste.liste]
                .sort((a, b) => b.totale - a.totale)
                .map((lista, idx) => {
                  const pct = ((lista.totale / totalVotes) * 100).toFixed(1);
                  return (
                    <div key={lista.nome}>
                      <div className="flex justify-between mb-1 text-sm md:text-base">
                        <span className="font-medium flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{lista.nome}</span>
                        </span>
                        <span className="text-gray-600 ml-2">
                          {lista.totale.toLocaleString('it-IT')} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          style={{ width: `${parseFloat(pct) * 2}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {preferenze && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Top Candidati per Preferenze</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preferenze.liste
                  .flatMap((party) => party.candidati.map((c) => ({ ...c, party: party.nome })))
                  .sort((a, b) => b.totale - a.totale)
                  .slice(0, 9)
                  .map((candidate, idx) => (
                    <div key={`${candidate.party}-${candidate.nome}`} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-300'}`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{candidate.nome}</div>
                          <div className="text-xs text-gray-500 truncate">{candidate.party}</div>
                          <div className="text-sm font-bold text-blue-600 mt-1">
                            {candidate.totale.toLocaleString('it-IT')} voti
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For preferences-only elections (regionali 2010)
  if (preferenze) {
    const allCandidates = preferenze.liste
      .flatMap((party) => party.candidati.map((c) => ({ ...c, party: party.nome })))
      .sort((a, b) => b.totale - a.totale);
    const topCandidate = allCandidates[0];
    const totalVotes = allCandidates.reduce((s, c) => s + c.totale, 0);
    const topParty = [...preferenze.liste]
      .map(p => ({ nome: p.nome, totale: p.candidati.reduce((s, c) => s + c.totale, 0) }))
      .sort((a, b) => b.totale - a.totale)[0];

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        <Header title={config.label} subtitle={`Ascoli Piceno - ${preferenze.data}`} />
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatCard
              title="Primo Candidato"
              value={topCandidate?.nome || '-'}
              subtitle={topCandidate ? `${topCandidate.totale.toLocaleString('it-IT')} preferenze` : ''}
              icon="👑"
              color="green"
            />
            <StatCard
              title="Prima Lista"
              value={topParty?.nome || '-'}
              subtitle={topParty ? `${topParty.totale.toLocaleString('it-IT')} preferenze` : ''}
              icon="🏆"
              color="blue"
            />
            <StatCard
              title="Liste"
              value={preferenze.liste.length}
              subtitle="partecipanti"
              icon="📋"
              color="amber"
            />
            <StatCard
              title="Candidati"
              value={totalCandidates}
              subtitle="consiglieri"
              icon="👥"
              color="purple"
            />
          </div>

          {votanti && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Elettori Totali</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-blue-700">
                      {votanti.totale_comune.uomini.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-blue-600">Uomini</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-pink-700">
                      {votanti.totale_comune.donne.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-pink-600">Donne</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl md:text-2xl font-bold text-green-700">
                      {votanti.totale_comune.totale.toLocaleString('it-IT')}
                    </div>
                    <div className="text-xs md:text-sm text-green-600">Totale</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Preferenze Totali</h3>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-700">
                    {totalVotes.toLocaleString('it-IT')}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    preferenze espresse su {preferenze.liste.length} liste
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
            <h3 className="text-lg font-semibold mb-4">Top 10 Liste per Preferenze</h3>
            <div className="space-y-3">
              {[...preferenze.liste]
                .map(p => ({ nome: p.nome, totale: p.candidati.reduce((s, c) => s + c.totale, 0) }))
                .sort((a, b) => b.totale - a.totale)
                .slice(0, 10)
                .map((lista, idx) => {
                  const pct = totalVotes > 0 ? ((lista.totale / totalVotes) * 100).toFixed(1) : '0';
                  return (
                    <div key={lista.nome}>
                      <div className="flex justify-between mb-1 text-sm md:text-base">
                        <span className="font-medium flex items-center gap-2">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{lista.nome}</span>
                        </span>
                        <span className="text-gray-600 ml-2">
                          {lista.totale.toLocaleString('it-IT')} ({pct}%)
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                          style={{ width: `${parseFloat(pct) * 2}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4">Top Candidati per Preferenze</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCandidates.slice(0, 9).map((candidate, idx) => (
                <div key={`${candidate.party}-${candidate.nome}`} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${idx < 3 ? 'bg-amber-500 text-white' : 'bg-gray-300'}`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{candidate.nome}</div>
                      <div className="text-xs text-gray-500 truncate">{candidate.party}</div>
                      <div className="text-sm font-bold text-blue-600 mt-1">
                        {candidate.totale.toLocaleString('it-IT')} preferenze
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <Header title={config.label} subtitle="Ascoli Piceno" />
      <div className="p-4 md:p-6">
        <div className="text-center text-gray-500">
          Nessun dato disponibile per questa elezione.
        </div>
      </div>
    </div>
  );
}

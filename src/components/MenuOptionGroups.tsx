import { useCallback, useEffect, useState, type KeyboardEvent } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toUserMessage } from '../lib/errors'
import type { MenuItemOption, MenuItemOptionGroup } from '../types/menu'

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

type SelectionType = MenuItemOptionGroup['selection_type']

const SELECTION_LABELS: Record<SelectionType, string> = {
  single: 'Einfachauswahl',
  multiple: 'Mehrfachauswahl',
}

interface GroupDraft {
  name: string
  selectionType: SelectionType
  isRequired: boolean
  /** Empty means "no limit" — the column is nullable and `ItemSheet` treats null as unlimited. */
  maxSelections: string
  displayOrder: string
}

interface OptionDraft {
  label: string
  priceDelta: string
  displayOrder: string
}

const EMPTY_GROUP_DRAFT: GroupDraft = {
  name: '',
  selectionType: 'single',
  isRequired: false,
  maxSelections: '',
  displayOrder: '',
}

const EMPTY_OPTION_DRAFT: OptionDraft = { label: '', priceDelta: '', displayOrder: '' }

/**
 * `max_selections` is optional: an empty field means unlimited, so it maps to null
 * rather than 0 (which would let the customer pick nothing in a multiple group).
 * Returns `undefined` for a value that isn't a positive whole number, so callers
 * can reject it instead of silently writing nonsense.
 */
function parseMaxSelections(raw: string): number | null | undefined {
  if (raw.trim() === '') return null
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1) return undefined
  return value
}

/** Rows as PostgREST returns them — `price_delta` is numeric, so it is normalised on read. */
interface GroupRow {
  id: string
  menu_item_id: string
  name: string
  selection_type: SelectionType
  is_required: boolean
  max_selections: number | null
  display_order: number
}

interface OptionRow {
  id: string
  group_id: string
  label: string
  price_delta: number | string
  display_order: number
}

interface MenuOptionGroupsProps {
  /** The dish these groups belong to. The row must already exist — see the hint in MenuItemForm. */
  menuItemId: string
}

/**
 * Extras editor for one dish: the `menu_item_option_groups` / `menu_item_options`
 * rows that `ItemSheet` renders as the customer's option pickers.
 *
 * Writes go straight to the tables on each action rather than being staged until
 * the dish form is submitted — same as the variants block above it, and the same
 * reason: these are separate rows with their own ids, and half-saved groups would
 * be worse than a save per edit. RLS restricts both tables to inhaber/manager,
 * which is exactly who can reach /staff/admin.
 *
 * Deleting a group cascades to its options in Postgres (ON DELETE CASCADE), which
 * is why that one action asks for confirmation while removing a single option
 * does not.
 */
export function MenuOptionGroups({ menuItemId }: MenuOptionGroupsProps) {
  const [groups, setGroups] = useState<MenuItemOptionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [newGroup, setNewGroup] = useState<GroupDraft>(EMPTY_GROUP_DRAFT)
  const [editingGroup, setEditingGroup] = useState<{ id: string; draft: GroupDraft } | null>(null)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<string | null>(null)

  const [newOptions, setNewOptions] = useState<Record<string, OptionDraft>>({})
  const [editingOption, setEditingOption] = useState<{ id: string; draft: OptionDraft } | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)

    const { data: groupRows, error: groupError } = await supabase
      .from('menu_item_option_groups')
      .select('*')
      .eq('menu_item_id', menuItemId)
      .order('display_order')

    if (groupError) {
      setError(toUserMessage(groupError, 'Optionsgruppen konnten nicht geladen werden.'))
      setLoading(false)
      return
    }

    const rows = (groupRows ?? []) as GroupRow[]
    const groupIds = rows.map((row) => row.id)

    let optionRows: OptionRow[] = []
    if (groupIds.length > 0) {
      const { data, error: optionError } = await supabase
        .from('menu_item_options')
        .select('*')
        .in('group_id', groupIds)
        .order('display_order')

      if (optionError) {
        setError(toUserMessage(optionError, 'Optionen konnten nicht geladen werden.'))
        setLoading(false)
        return
      }
      optionRows = (data ?? []) as OptionRow[]
    }

    const optionsByGroup = new Map<string, MenuItemOption[]>()
    for (const row of optionRows) {
      const list = optionsByGroup.get(row.group_id) ?? []
      list.push({
        id: row.id,
        group_id: row.group_id,
        label: row.label,
        price_delta: Number(row.price_delta),
        display_order: row.display_order,
      })
      optionsByGroup.set(row.group_id, list)
    }

    setGroups(
      rows.map((row) => ({
        id: row.id,
        menu_item_id: row.menu_item_id,
        name: row.name,
        selection_type: row.selection_type,
        is_required: row.is_required,
        max_selections: row.max_selections,
        display_order: row.display_order,
        options: optionsByGroup.get(row.id) ?? [],
      })),
    )
    setLoading(false)
  }, [menuItemId])

  useEffect(() => {
    reload()
  }, [reload])

  /** The block lives inside the dish <form>, so Enter would otherwise submit the dish. */
  const runOnEnter = (action: () => void) => (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    action()
  }

  const optionDraftFor = (groupId: string) => newOptions[groupId] ?? EMPTY_OPTION_DRAFT

  const setOptionDraft = (groupId: string, draft: OptionDraft) => {
    setNewOptions((prev) => ({ ...prev, [groupId]: draft }))
  }

  const addGroup = async () => {
    const name = newGroup.name.trim()
    if (!name || busy) return

    const maxSelections = parseMaxSelections(newGroup.maxSelections)
    if (maxSelections === undefined) {
      setError('Die maximale Auswahl muss eine ganze Zahl ab 1 sein — oder leer für unbegrenzt.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: insertError } = await supabase.from('menu_item_option_groups').insert({
      menu_item_id: menuItemId,
      name,
      selection_type: newGroup.selectionType,
      is_required: newGroup.isRequired,
      max_selections: maxSelections,
      display_order: newGroup.displayOrder === '' ? groups.length : Number(newGroup.displayOrder) || 0,
    })
    setBusy(false)

    if (insertError) {
      setError(toUserMessage(insertError, 'Optionsgruppe konnte nicht angelegt werden.'))
      return
    }
    setNewGroup(EMPTY_GROUP_DRAFT)
    await reload()
  }

  const saveGroup = async () => {
    if (!editingGroup || busy) return
    const name = editingGroup.draft.name.trim()
    if (!name) return

    const maxSelections = parseMaxSelections(editingGroup.draft.maxSelections)
    if (maxSelections === undefined) {
      setError('Die maximale Auswahl muss eine ganze Zahl ab 1 sein — oder leer für unbegrenzt.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('menu_item_option_groups')
      .update({
        name,
        selection_type: editingGroup.draft.selectionType,
        is_required: editingGroup.draft.isRequired,
        max_selections: maxSelections,
        display_order: Number(editingGroup.draft.displayOrder) || 0,
      })
      .eq('id', editingGroup.id)
    setBusy(false)

    if (updateError) {
      setError(toUserMessage(updateError, 'Optionsgruppe konnte nicht gespeichert werden.'))
      return
    }
    setEditingGroup(null)
    await reload()
  }

  const deleteGroup = async (groupId: string) => {
    setBusy(true)
    setError(null)
    const { error: deleteError } = await supabase.from('menu_item_option_groups').delete().eq('id', groupId)
    setBusy(false)
    setConfirmDeleteGroup(null)

    if (deleteError) {
      setError(toUserMessage(deleteError, 'Optionsgruppe konnte nicht gelöscht werden.'))
      return
    }
    await reload()
  }

  const addOption = async (group: MenuItemOptionGroup) => {
    const draft = optionDraftFor(group.id)
    const label = draft.label.trim()
    if (!label || busy) return

    const priceDelta = draft.priceDelta === '' ? 0 : Number(draft.priceDelta)
    if (Number.isNaN(priceDelta) || priceDelta < 0) {
      setError('Der Aufpreis darf nicht negativ sein.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: insertError } = await supabase.from('menu_item_options').insert({
      group_id: group.id,
      label,
      price_delta: priceDelta,
      display_order: draft.displayOrder === '' ? group.options.length : Number(draft.displayOrder) || 0,
    })
    setBusy(false)

    if (insertError) {
      setError(toUserMessage(insertError, 'Option konnte nicht hinzugefügt werden.'))
      return
    }
    setOptionDraft(group.id, EMPTY_OPTION_DRAFT)
    await reload()
  }

  const saveOption = async () => {
    if (!editingOption || busy) return
    const label = editingOption.draft.label.trim()
    if (!label) return

    const priceDelta = editingOption.draft.priceDelta === '' ? 0 : Number(editingOption.draft.priceDelta)
    if (Number.isNaN(priceDelta) || priceDelta < 0) {
      setError('Der Aufpreis darf nicht negativ sein.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: updateError } = await supabase
      .from('menu_item_options')
      .update({
        label,
        price_delta: priceDelta,
        display_order: Number(editingOption.draft.displayOrder) || 0,
      })
      .eq('id', editingOption.id)
    setBusy(false)

    if (updateError) {
      setError(toUserMessage(updateError, 'Option konnte nicht gespeichert werden.'))
      return
    }
    setEditingOption(null)
    await reload()
  }

  const deleteOption = async (optionId: string) => {
    setBusy(true)
    setError(null)
    const { error: deleteError } = await supabase.from('menu_item_options').delete().eq('id', optionId)
    setBusy(false)

    if (deleteError) {
      setError(toUserMessage(deleteError, 'Option konnte nicht entfernt werden.'))
      return
    }
    await reload()
  }

  return (
    <div className="menu-admin-options">
      <h5 className="menu-admin-variants__title">Extras / Optionen</h5>

      {loading && <p className="menu-admin-hint">Optionen werden geladen…</p>}

      {!loading && groups.length === 0 && (
        <p className="menu-admin-hint">Keine Optionsgruppen — dieses Gericht wird ohne Extras bestellt.</p>
      )}

      {!loading &&
        groups.map((group) => {
          const isEditingGroup = editingGroup?.id === group.id
          const draft = optionDraftFor(group.id)

          return (
            <div key={group.id} className="menu-admin-option-group">
              {isEditingGroup ? (
                <div className="menu-admin-option-group__edit">
                  <input
                    type="text"
                    value={editingGroup.draft.name}
                    aria-label="Name der Gruppe"
                    onChange={(e) => setEditingGroup({ id: group.id, draft: { ...editingGroup.draft, name: e.target.value } })}
                    onKeyDown={runOnEnter(saveGroup)}
                  />
                  <select
                    value={editingGroup.draft.selectionType}
                    aria-label="Auswahlart"
                    onChange={(e) =>
                      setEditingGroup({
                        id: group.id,
                        draft: { ...editingGroup.draft, selectionType: e.target.value as SelectionType },
                      })
                    }
                  >
                    <option value="single">{SELECTION_LABELS.single}</option>
                    <option value="multiple">{SELECTION_LABELS.multiple}</option>
                  </select>
                  <label className="menu-admin-toggle">
                    <input
                      type="checkbox"
                      checked={editingGroup.draft.isRequired}
                      onChange={(e) =>
                        setEditingGroup({
                          id: group.id,
                          draft: { ...editingGroup.draft, isRequired: e.target.checked },
                        })
                      }
                    />
                    Pflichtauswahl
                  </label>
                  {/* Only ever consulted for Mehrfachauswahl — a single group is capped at 1 by definition. */}
                  {editingGroup.draft.selectionType === 'multiple' && (
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="menu-admin-max-input"
                      placeholder="Max. (leer = unbegrenzt)"
                      value={editingGroup.draft.maxSelections}
                      aria-label="Maximale Anzahl Auswahlen (leer = unbegrenzt)"
                      onChange={(e) =>
                        setEditingGroup({
                          id: group.id,
                          draft: { ...editingGroup.draft, maxSelections: e.target.value },
                        })
                      }
                      onKeyDown={runOnEnter(saveGroup)}
                    />
                  )}
                  <input
                    type="number"
                    value={editingGroup.draft.displayOrder}
                    aria-label="Reihenfolge"
                    onChange={(e) =>
                      setEditingGroup({ id: group.id, draft: { ...editingGroup.draft, displayOrder: e.target.value } })
                    }
                    onKeyDown={runOnEnter(saveGroup)}
                  />
                  <button type="button" className="btn btn-secondary" onClick={saveGroup} disabled={busy}>
                    Speichern
                  </button>
                  <button
                    type="button"
                    className="menu-admin-icon-btn"
                    onClick={() => setEditingGroup(null)}
                    aria-label="Abbrechen"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="menu-admin-option-group__header">
                  <span className="menu-admin-option-group__name">{group.name}</span>
                  <span className="badge">{SELECTION_LABELS[group.selection_type]}</span>
                  {group.is_required && <span className="badge badge-primary">Pflicht</span>}
                  {group.selection_type === 'multiple' && group.max_selections !== null && (
                    <span className="badge">max. {group.max_selections}</span>
                  )}
                  <span className="menu-admin-hint">Reihenfolge {group.display_order}</span>

                  {confirmDeleteGroup === group.id ? (
                    <span className="menu-admin-option-group__confirm">
                      <span className="menu-admin-hint">Gruppe mit allen Optionen löschen?</span>
                      <button
                        type="button"
                        className="cart-line__remove"
                        onClick={() => deleteGroup(group.id)}
                        disabled={busy}
                      >
                        Löschen
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setConfirmDeleteGroup(null)}
                      >
                        Abbrechen
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="menu-admin-icon-btn"
                        onClick={() =>
                          setEditingGroup({
                            id: group.id,
                            draft: {
                              name: group.name,
                              selectionType: group.selection_type,
                              isRequired: group.is_required,
                              maxSelections: group.max_selections === null ? '' : String(group.max_selections),
                              displayOrder: String(group.display_order),
                            },
                          })
                        }
                        aria-label={`${group.name} umbenennen`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="menu-admin-icon-btn menu-admin-icon-btn--danger"
                        onClick={() => setConfirmDeleteGroup(group.id)}
                        aria-label={`${group.name} löschen`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {group.options.length === 0 && (
                <p className="menu-admin-hint">Noch keine Optionen in dieser Gruppe.</p>
              )}

              {group.options.length > 0 && (
                <ul className="menu-admin-option-list">
                  {group.options.map((option) =>
                    editingOption?.id === option.id ? (
                      <li key={option.id} className="menu-admin-option-list__edit">
                        <input
                          type="text"
                          value={editingOption.draft.label}
                          aria-label="Bezeichnung"
                          onChange={(e) =>
                            setEditingOption({ id: option.id, draft: { ...editingOption.draft, label: e.target.value } })
                          }
                          onKeyDown={runOnEnter(saveOption)}
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingOption.draft.priceDelta}
                          aria-label="Aufpreis in Euro"
                          onChange={(e) =>
                            setEditingOption({
                              id: option.id,
                              draft: { ...editingOption.draft, priceDelta: e.target.value },
                            })
                          }
                          onKeyDown={runOnEnter(saveOption)}
                        />
                        <input
                          type="number"
                          value={editingOption.draft.displayOrder}
                          aria-label="Reihenfolge"
                          onChange={(e) =>
                            setEditingOption({
                              id: option.id,
                              draft: { ...editingOption.draft, displayOrder: e.target.value },
                            })
                          }
                          onKeyDown={runOnEnter(saveOption)}
                        />
                        <button type="button" className="menu-admin-icon-btn" onClick={saveOption} aria-label="Speichern">
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="menu-admin-icon-btn"
                          onClick={() => setEditingOption(null)}
                          aria-label="Abbrechen"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ) : (
                      <li key={option.id}>
                        <span className="menu-admin-option-list__label">{option.label}</span>
                        <span>{option.price_delta > 0 ? `+${currency.format(option.price_delta)}` : 'ohne Aufpreis'}</span>
                        <span className="menu-admin-hint">Reihenfolge {option.display_order}</span>
                        <button
                          type="button"
                          className="menu-admin-icon-btn"
                          onClick={() =>
                            setEditingOption({
                              id: option.id,
                              draft: {
                                label: option.label,
                                priceDelta: String(option.price_delta),
                                displayOrder: String(option.display_order),
                              },
                            })
                          }
                          aria-label={`${option.label} bearbeiten`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="menu-admin-icon-btn menu-admin-icon-btn--danger"
                          onClick={() => deleteOption(option.id)}
                          aria-label={`${option.label} entfernen`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}

              <div className="menu-admin-variants__add">
                <input
                  type="text"
                  placeholder="Bezeichnung (z. B. Extra Käse)"
                  value={draft.label}
                  onChange={(e) => setOptionDraft(group.id, { ...draft, label: e.target.value })}
                  onKeyDown={runOnEnter(() => addOption(group))}
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Aufpreis"
                  value={draft.priceDelta}
                  onChange={(e) => setOptionDraft(group.id, { ...draft, priceDelta: e.target.value })}
                  onKeyDown={runOnEnter(() => addOption(group))}
                />
                <input
                  type="number"
                  placeholder="Reihenfolge"
                  value={draft.displayOrder}
                  onChange={(e) => setOptionDraft(group.id, { ...draft, displayOrder: e.target.value })}
                  onKeyDown={runOnEnter(() => addOption(group))}
                />
                <button type="button" className="btn btn-secondary" onClick={() => addOption(group)} disabled={busy}>
                  <Plus size={15} />
                  Option
                </button>
              </div>
            </div>
          )
        })}

      {!loading && (
        <div className="menu-admin-variants__add">
          <input
            type="text"
            placeholder="Neue Gruppe (z. B. Extras)"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            onKeyDown={runOnEnter(addGroup)}
          />
          <select
            value={newGroup.selectionType}
            aria-label="Auswahlart der neuen Gruppe"
            onChange={(e) => setNewGroup({ ...newGroup, selectionType: e.target.value as SelectionType })}
          >
            <option value="single">{SELECTION_LABELS.single}</option>
            <option value="multiple">{SELECTION_LABELS.multiple}</option>
          </select>
          <label className="menu-admin-toggle">
            <input
              type="checkbox"
              checked={newGroup.isRequired}
              onChange={(e) => setNewGroup({ ...newGroup, isRequired: e.target.checked })}
            />
            Pflichtauswahl
          </label>
          {newGroup.selectionType === 'multiple' && (
            <input
              type="number"
              min="1"
              step="1"
              className="menu-admin-max-input"
              placeholder="Max. (leer = unbegrenzt)"
              value={newGroup.maxSelections}
              aria-label="Maximale Anzahl Auswahlen (leer = unbegrenzt)"
              onChange={(e) => setNewGroup({ ...newGroup, maxSelections: e.target.value })}
              onKeyDown={runOnEnter(addGroup)}
            />
          )}
          <input
            type="number"
            placeholder="Reihenfolge"
            value={newGroup.displayOrder}
            onChange={(e) => setNewGroup({ ...newGroup, displayOrder: e.target.value })}
            onKeyDown={runOnEnter(addGroup)}
          />
          <button type="button" className="btn btn-secondary" onClick={addGroup} disabled={busy}>
            <Plus size={15} />
            Gruppe hinzufügen
          </button>
        </div>
      )}

      {error && <p className="menu-state menu-state--error">{error}</p>}
    </div>
  )
}

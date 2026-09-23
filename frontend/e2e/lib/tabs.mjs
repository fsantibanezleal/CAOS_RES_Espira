// Opening a view on a page whose tabs are grouped. Not a gate itself.
//
// The Experiments page groups its views by the question a reader arrives with (ADR-0071 section 5):
// a row of group tabs, and inside the open group a row of sub-tabs for its views. A gate that wants a
// view by name therefore has to find which group holds it first. It does that by looking, not by a
// table of which view lives where, so regrouping the page later cannot silently send a gate to the
// wrong place: the gate either finds the view or fails saying it could not.

/**
 * Open the view whose tab is named `name` exactly, opening its group first if it is not showing.
 *
 * @returns the group label it was found under, or null if the view was already visible.
 */
export async function openView(page, name) {
  const view = page.getByRole('tab', { name, exact: true });
  if ((await view.count()) === 1 && (await view.isVisible())) {
    await view.click();
    return null;
  }
  const groups = page.locator('main .tablist > [role="tab"]');
  const count = await groups.count();
  for (let index = 0; index < count; index += 1) {
    const group = groups.nth(index);
    await group.click();
    if ((await view.count()) === 1 && (await view.isVisible())) {
      await view.click();
      return (await group.innerText()).trim();
    }
  }
  throw new Error(`no view named "${name}" under any of the ${count} groups on this page`);
}

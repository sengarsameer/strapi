'use strict';

const { getService } = require('../../../../utils');
const { DEFAULT_LOCALE } = require('../../../../constants');

const getDefaultLocale = async (model, ORM) => {
  let defaultLocaleRows;
  if (model.orm === 'bookshelf') {
    defaultLocaleRows = await ORM.knex('core_store')
      .select('value')
      .where({ key: 'plugin_i18n_default_locale' });
  } else if (model.orm === 'mongoose') {
    defaultLocaleRows = await strapi.models['core_store'].find({
      key: 'plugin_i18n_default_locale',
    });
  }

  if (defaultLocaleRows.length > 0) {
    return JSON.parse(defaultLocaleRows[0].value);
  }

  return DEFAULT_LOCALE.code;
};

const updateLocale = (model, ORM, locale) => {
  if (model.orm === 'bookshelf') {
    return ORM.knex(model.collectionName)
      .update({ locale })
      .where({ locale: null });
  }

  if (model.orm === 'mongoose') {
    return model.updateMany(
      { $or: [{ locale: { $exists: false } }, { locale: null }] },
      { locale }
    );
  }
};

// Enable i18n on CT -> Add default locale to all existing entities
const after = async ({ model, definition, previousDefinition, ORM }) => {
  const ctService = getService('content-types');

  if (!ctService.isLocalized(definition) || ctService.isLocalized(previousDefinition)) {
    return;
  }

  const defaultLocale = await getDefaultLocale(model, ORM);

  await updateLocale(model, ORM, defaultLocale);
};

// Disable i18n on CT -> Delete all entities that are not in the default locale
const before = () => {};

module.exports = {
  before,
  after,
};
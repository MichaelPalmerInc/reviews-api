import characteristicsMigration from './characteristicsMigration';
import productsMigration from './productsMigration';
import reviewCharacteristicsMigration from './reviewCharacteristicsMigration';
import reviewPhotoMigration from './reviewPhotoMigration';

if (require.main === module) {
  (async () => {
    await productsMigration();
    await characteristicsMigration();
    await reviewCharacteristicsMigration();
    await reviewPhotoMigration();
  })();
}

export default { characteristicsMigration, productsMigration, reviewCharacteristicsMigration, reviewPhotoMigration };

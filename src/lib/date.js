
import moment from 'moment';

// Configure Moment.js pour utiliser le français
moment.locale('fr');

/**
 * Formate un timestamp en format jour/mois/année heure:minute
 * @param {number} timestamp - Timestamp en secondes ou millisecondes
 * @param {boolean} isSeconds - Indique si le timestamp est en secondes (true) ou millisecondes (false)
 * @returns {string} Date formatée (ex: 25/07/2023 14:30)
 */
export function formatShortDate(timestamp, isSeconds = true) {
    if (isSeconds) {
        return moment.unix(timestamp).format('DD/MM/YYYY HH:mm');
    } else {
        return moment(timestamp).format('DD/MM/YYYY HH:mm');
    }
}

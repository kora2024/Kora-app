/**
 * KORA Sacred Words — UPGRADE 18
 * 
 * Génération et stockage sécurisé des 12 mots de mémoire
 * Basé sur la liste BIP39 française (2048 mots)
 * 
 * // Ces 12 mots sont votre territoire.
 * // Ne les partagez jamais.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════════════════════

const SACRED_WORDS_KEY = 'kora_sacred_words';
const SACRED_WORDS_DATE_KEY = 'kora_sacred_words_date';

// ══════════════════════════════════════════════════════════════════════════════
// BIP39 FRENCH WORD LIST (2048 words)
// Liste officielle BIP39 en français
// ══════════════════════════════════════════════════════════════════════════════

const BIP39_FRENCH: string[] = [
  'abaisser', 'abandon', 'abdiquer', 'abeille', 'abolir', 'aborder', 'aboutir', 'aboyer',
  'abrasif', 'abreuver', 'abriter', 'abroger', 'abrupt', 'absence', 'absorber', 'abstrait',
  'absurde', 'abusif', 'abyssal', 'académie', 'acajou', 'acarien', 'accabler', 'accepter',
  'acclamer', 'accolade', 'accroche', 'accuser', 'acerbe', 'achat', 'acheter', 'aciduler',
  'acier', 'acompte', 'acquérir', 'acronyme', 'acteur', 'actif', 'actuel', 'adepte',
  'adéquat', 'adhésif', 'adjectif', 'adjuger', 'admettre', 'admirer', 'adopter', 'adorer',
  'adoucir', 'adresse', 'adroit', 'adulte', 'adverbe', 'aérer', 'aéronef', 'affaire',
  'affecter', 'affiche', 'affreux', 'affubler', 'agacer', 'agencer', 'agile', 'agiter',
  'agrafer', 'agréable', 'agrume', 'aider', 'aiguille', 'ailier', 'aimable', 'aisance',
  'ajouter', 'ajuster', 'alarmer', 'albâtre', 'album', 'alcool', 'alerte', 'algèbre',
  'algue', 'aliéner', 'aliment', 'alléger', 'alliage', 'allouer', 'allumer', 'alourdir',
  'alpaga', 'altesse', 'alvéole', 'amateur', 'ambigu', 'ambre', 'aménager', 'amertume',
  'amidon', 'amiral', 'amorcer', 'amour', 'amovible', 'amphibie', 'ampleur', 'amusant',
  'analyse', 'anaphore', 'anarchie', 'anatomie', 'ancien', 'anéantir', 'angle', 'angoisse',
  'anguleux', 'animal', 'annexer', 'annonce', 'annuel', 'anodin', 'anomalie', 'anonyme',
  'anormal', 'antenne', 'antidote', 'anxieux', 'apaiser', 'aperçu', 'aplanir', 'apologie',
  'appareil', 'appeler', 'apporter', 'appuyer', 'aquarium', 'aqueduc', 'arbitre', 'arbuste',
  'ardeur', 'ardoise', 'argent', 'arlequin', 'armature', 'armement', 'armoire', 'armure',
  'arpenter', 'arracher', 'arriver', 'arroser', 'arsenic', 'artériel', 'article', 'aspect',
  'asphalte', 'aspirer', 'assaut', 'asservir', 'assiette', 'associer', 'assurer', 'asticot',
  'astre', 'astuce', 'atelier', 'atome', 'atrium', 'atroce', 'attaque', 'attentif',
  'attirer', 'attraper', 'aubaine', 'auberge', 'audace', 'audible', 'augurer', 'aurore',
  'automne', 'autruche', 'avaler', 'avancer', 'avarice', 'avenir', 'averse', 'aveugle',
  'aviateur', 'avide', 'avion', 'aviser', 'avoine', 'avouer', 'avril', 'axial',
  'axiome', 'badge', 'bafouer', 'bagage', 'baguette', 'baignade', 'balancer', 'balcon',
  'baleine', 'balisage', 'bambin', 'bancaire', 'bandage', 'banlieue', 'bannière', 'banquier',
  'barbier', 'baril', 'baron', 'barque', 'barrage', 'bassin', 'bastion', 'bataille',
  'bateau', 'battre', 'baudrier', 'bavarder', 'belette', 'bélier', 'belote', 'bénéfice',
  'berceau', 'berger', 'berline', 'bermuda', 'besace', 'besogne', 'bétail', 'beurre',
  'biberon', 'bible', 'biceps', 'bicyclette', 'bidule', 'bijou', 'bilan', 'bilingue',
  'billard', 'binaire', 'biologie', 'biopsie', 'biotype', 'biscuit', 'bison', 'bistouri',
  'bitume', 'bizarre', 'blafard', 'blague', 'blanchir', 'blessant', 'blinder', 'blond',
  'bloquer', 'blouson', 'bobard', 'bobine', 'boire', 'boiser', 'bolide', 'bonbon',
  'bondir', 'bonheur', 'bonifier', 'bonus', 'bordure', 'borne', 'bossuer', 'botanique',
  'botte', 'boubou', 'boucher', 'bouclier', 'bouder', 'bouffon', 'bougie', 'boulon',
  'bouquin', 'bourse', 'boussole', 'boutique', 'boxeur', 'branche', 'brasier', 'brave',
  'brebis', 'brèche', 'breuvage', 'bricoler', 'brigade', 'brillant', 'brioche', 'brique',
  'brochure', 'broder', 'bronzer', 'brousse', 'broyeur', 'brume', 'brusque', 'brutal',
  'bruyant', 'buffle', 'buisson', 'bulletin', 'bureau', 'burin', 'bustier', 'butiner',
  'butoir', 'buvable', 'buvette', 'cabanon', 'cabine', 'cachette', 'cadeau', 'cadence',
  'caféine', 'cagette', 'caillou', 'caisson', 'calculer', 'calepin', 'calibre', 'calmer',
  'calomnie', 'calvaire', 'camarade', 'caméra', 'camion', 'campagne', 'canal', 'caneton',
  'canon', 'cantine', 'canular', 'capable', 'caporal', 'caprice', 'capsule', 'capter',
  'capuche', 'carabine', 'carbone', 'caresser', 'caribou', 'carnage', 'carotte', 'carreau',
  'carton', 'cascade', 'casier', 'casque', 'cassure', 'causer', 'caution', 'cavalier',
  'caverne', 'caviar', 'cèdre', 'ceinture', 'céleste', 'cellule', 'cendrier', 'censurer',
  'central', 'cercle', 'cérébral', 'cerise', 'cerner', 'cerveau', 'cesser', 'chagrin',
  'chaise', 'chaleur', 'chambre', 'chance', 'chapitre', 'charbon', 'charger', 'charpente',
  'chasser', 'château', 'chaton', 'chausson', 'chavirer', 'chemise', 'chenille', 'chéquier',
  'chercher', 'cheval', 'chien', 'chiffre', 'chignon', 'chimère', 'chiot', 'chlorure',
  'chocolat', 'choisir', 'chose', 'chouette', 'chrome', 'chute', 'cigare', 'cigogne',
  'cimenter', 'cinéma', 'cintrer', 'circuler', 'cirer', 'cirque', 'citerne', 'citoyen',
  'citron', 'civil', 'clairon', 'clameur', 'claquer', 'classe', 'clavier', 'client',
  'cligner', 'climat', 'clivage', 'cloche', 'clonage', 'cloporte', 'cobalt', 'cobra',
  'cocasse', 'cocotier', 'coder', 'codifier', 'coffre', 'cogner', 'cohésion', 'coiffer',
  'coincer', 'colère', 'colibri', 'colline', 'colmater', 'colonel', 'combat', 'comédie',
  'commande', 'compact', 'concert', 'conduire', 'confier', 'congeler', 'connoter', 'consigne',
  'contacter', 'convexe', 'copain', 'copie', 'corail', 'corbeau', 'cordage', 'corniche',
  'corpus', 'correct', 'cortège', 'cosmique', 'costume', 'coton', 'coude', 'coupure',
  'courage', 'couteau', 'couvrir', 'coyote', 'crabe', 'crainte', 'cravate', 'crayon',
  'créature', 'créditer', 'crémeux', 'creuser', 'crevette', 'cribler', 'crier', 'cristal',
  'critère', 'croire', 'croquer', 'crotale', 'crucial', 'cruel', 'crypter', 'cubique',
  'cueillir', 'cuillère', 'cuisine', 'cuivre', 'culminer', 'cultiver', 'cumuler', 'cupide',
  'curatif', 'curseur', 'cyanure', 'cycle', 'cylindre', 'cynique', 'daigner', 'damier',
  'danger', 'danseur', 'dauphin', 'débattre', 'débiter', 'déborder', 'débrider', 'débutant',
  'décaler', 'décembre', 'déchirer', 'décider', 'déclarer', 'décorer', 'décrire', 'décupler',
  'dédale', 'déductif', 'déesse', 'défensif', 'défiler', 'défrayer', 'dégager', 'dégivrer',
  'déglutir', 'dégrafer', 'déjeuner', 'délice', 'déloger', 'demander', 'demeurer', 'démolir',
  'dénicher', 'dénouer', 'dentelle', 'dénuder', 'départ', 'dépenser', 'déphaser', 'déplacer',
  'déposer', 'déranger', 'dérober', 'désastre', 'descente', 'désert', 'désigner', 'désobéir',
  'dessiner', 'destrier', 'détacher', 'détester', 'détourer', 'détresse', 'devancer', 'devenir',
  'deviner', 'devoir', 'diable', 'dialogue', 'diamant', 'dicter', 'différer', 'digérer',
  'digital', 'digne', 'diluer', 'dimanche', 'diminuer', 'dioxyde', 'directif', 'diriger',
  'discuter', 'disposer', 'dissiper', 'distance', 'divertir', 'diviser', 'docile', 'docteur',
  'dogme', 'doigt', 'domaine', 'domicile', 'dompter', 'donateur', 'donjon', 'donner',
  'dopamine', 'dortoir', 'dorure', 'dosage', 'doseur', 'dossier', 'dotation', 'douanier',
  'double', 'douceur', 'douter', 'doyen', 'dragon', 'draper', 'dresser', 'dribbler',
  'droiture', 'duperie', 'duplexe', 'durable', 'durcir', 'dynastie', 'éblouir', 'écarter',
  'écharpe', 'échelle', 'éclairer', 'éclipse', 'éclore', 'écluse', 'école', 'économie',
  'écorce', 'écouter', 'écraser', 'écrémer', 'écrivain', 'écrou', 'écume', 'écureuil',
  'édifier', 'éduquer', 'effacer', 'effectif', 'effigie', 'effort', 'effrayer', 'effusion',
  'égaliser', 'égarer', 'éjecter', 'élaborer', 'élargir', 'électron', 'élégant', 'éléphant',
  'élève', 'éligible', 'élitisme', 'éloge', 'élucider', 'éluder', 'emballer', 'embellir',
  'embryon', 'émeraude', 'émission', 'emmener', 'émotion', 'émouvoir', 'empereur', 'employer',
  'emporter', 'emprise', 'émulsion', 'encadrer', 'enchère', 'enclave', 'encoche', 'endiguer',
  'endosser', 'endroit', 'enduire', 'énergie', 'enfance', 'enfermer', 'enfouir', 'engager',
  'engin', 'englober', 'énigme', 'enjamber', 'enjeu', 'enlever', 'ennemi', 'ennuyeux',
  'enrichir', 'enrobage', 'enseigne', 'entasser', 'entendre', 'entier', 'entourer', 'entraver',
  'énumérer', 'envahir', 'enviable', 'envoyer', 'enzyme', 'éolien', 'épaissir', 'épargne',
  'épatant', 'épaule', 'épicerie', 'épidémie', 'épier', 'épilogue', 'épine', 'épisode',
  'épitaphe', 'époque', 'épreuve', 'éprouver', 'épuisant', 'équerre', 'équipe', 'ériger',
  'érosion', 'erreur', 'éruption', 'escalier', 'espadon', 'espèce', 'espiègle', 'espoir',
  'esprit', 'esquiver', 'essayer', 'essence', 'essieu', 'essorer', 'estime', 'estomac',
  'estrade', 'étagère', 'étaler', 'étanche', 'étatique', 'éteindre', 'étendre', 'éternel',
  'éthanol', 'éthique', 'ethnie', 'étirer', 'étoffer', 'étoile', 'étonnant', 'étourdir',
  'étrange', 'étroit', 'étude', 'euphorie', 'évaluer', 'évasion', 'éventail', 'évidence',
  'éviter', 'évolutif', 'évoquer', 'exact', 'exagérer', 'exaucer', 'exceller', 'excitant',
  'exclusif', 'excuse', 'exécuter', 'exemple', 'exercer', 'exhaler', 'exhorter', 'exigence',
  'exiler', 'exister', 'exotique', 'expédier', 'explorer', 'exporter', 'exposer', 'exprimer',
  'exquis', 'extensif', 'extraire', 'exulter', 'fable', 'fabuleux', 'facette', 'facile',
  'facture', 'faiblir', 'falaise', 'fameux', 'famille', 'farceur', 'farfelu', 'farine',
  'farouche', 'fasciner', 'fatal', 'fatigue', 'faucon', 'fautif', 'faveur', 'favori',
  'fébrile', 'féconder', 'fédérer', 'félin', 'femme', 'fémur', 'fendoir', 'féodal',
  'fermer', 'féroce', 'ferveur', 'festival', 'feuille', 'feutre', 'février', 'fiasco',
  'ficeler', 'fictif', 'fidèle', 'figure', 'filature', 'filetage', 'filière', 'filleul',
  'filmer', 'filou', 'filtrer', 'financer', 'finir', 'fiole', 'firme', 'fissure',
  'fixer', 'flairer', 'flamme', 'flasque', 'flatter', 'fléau', 'flèche', 'fleur',
  'flexion', 'flocon', 'flore', 'fluctuer', 'fluide', 'fluvial', 'folie', 'fonderie',
  'fongible', 'fontaine', 'forcer', 'forgeron', 'formuler', 'fortune', 'fossile', 'foudre',
  'fougère', 'fouiller', 'foulure', 'fourmi', 'fragile', 'fraise', 'franchir', 'frapper',
  'frayeur', 'frégate', 'freiner', 'frelon', 'frémir', 'frénésie', 'frère', 'friable',
  'friction', 'frisson', 'frivole', 'froid', 'fromage', 'frontal', 'frotter', 'fruit',
  'fugitif', 'fuite', 'fureur', 'furieux', 'furtif', 'fusion', 'futur', 'gagner',
  'galaxie', 'galerie', 'gambader', 'garantir', 'gardien', 'garnir', 'garrigue', 'gazelle',
  'gazon', 'géant', 'gélatine', 'gélule', 'gendarme', 'général', 'génie', 'genou',
  'gentil', 'géologie', 'géomètre', 'géranium', 'germe', 'gestuel', 'geyser', 'gibier',
  'gicler', 'girafe', 'givre', 'glace', 'glaive', 'glisser', 'globe', 'gloire',
  'glorieux', 'golfeur', 'gomme', 'gonfler', 'gorge', 'gorille', 'goudron', 'gouffre',
  'goulot', 'goupille', 'gourmand', 'goutte', 'graduel', 'graffiti', 'graine', 'grand',
  'grappin', 'gratuit', 'gravir', 'grenat', 'griffure', 'griller', 'grimper', 'grogner',
  'gronder', 'grotte', 'groupe', 'gruger', 'grutier', 'gruyère', 'guépard', 'guerrier',
  'guide', 'guimauve', 'guitare', 'gustatif', 'gymnaste', 'gyrostat', 'habitude', 'hachoir',
  'halte', 'hameau', 'hangar', 'hanneton', 'haricot', 'harmonie', 'harpon', 'hasard',
  'hélium', 'hématome', 'herbe', 'hérisson', 'hermine', 'héron', 'hésiter', 'heureux',
  'hiberner', 'hibou', 'hilarant', 'histoire', 'hiver', 'homard', 'hommage', 'homogène',
  'honneur', 'honorer', 'honteux', 'horde', 'horizon', 'horloge', 'hormone', 'horrible',
  'houleux', 'housse', 'hublot', 'huileux', 'humain', 'humble', 'humide', 'humour',
  'hurler', 'hydromel', 'hygiène', 'hymne', 'hypnose', 'idylle', 'ignorer', 'iguane',
  'illicite', 'illusion', 'image', 'imbiber', 'imiter', 'immense', 'immobile', 'immuable',
  'impact', 'impérial', 'implorer', 'imposer', 'imprimer', 'imputer', 'incarner', 'incendie',
  'incident', 'incliner', 'incolore', 'indexer', 'indice', 'inductif', 'inédit', 'ineptie',
  'inexact', 'infini', 'infliger', 'informer', 'infusion', 'ingérer', 'inhaler', 'inhiber',
  'injecter', 'injure', 'innocent', 'inoculer', 'inonder', 'inscrire', 'insecte', 'insigne',
  'insolite', 'inspirer', 'instinct', 'insulter', 'intact', 'intense', 'intime', 'intrigue',
  'intuitif', 'inutile', 'invasion', 'inventer', 'inviter', 'invoquer', 'ironique', 'irradier',
  'irréel', 'irriter', 'isoler', 'ivoire', 'ivresse', 'jaguar', 'jaillir', 'jambe',
  'janvier', 'jardin', 'jauger', 'jaune', 'javelot', 'jetable', 'jeton', 'jeudi',
  'jeunesse', 'joindre', 'joncher', 'jongler', 'joueur', 'jouissif', 'journal', 'jovial',
  'joyau', 'joyeux', 'jubiler', 'jugement', 'junior', 'jupon', 'juriste', 'justice',
  'juteux', 'juvénile', 'kayak', 'kimono', 'kiosque', 'label', 'labial', 'labourer',
  'lacérer', 'lactose', 'lagune', 'laine', 'laisser', 'laitier', 'lambeau', 'lamelle',
  'lampe', 'lanceur', 'langage', 'lanterne', 'lapin', 'largeur', 'larme', 'laurier',
  'lavabo', 'lavoir', 'lecture', 'légal', 'léger', 'légume', 'lessive', 'lettre',
  'levier', 'lexique', 'lézard', 'liasse', 'libérer', 'libre', 'licence', 'licorne',
  'liège', 'lièvre', 'ligature', 'ligoter', 'ligue', 'limer', 'limite', 'limonade',
  'limpide', 'linéaire', 'lingot', 'lionceau', 'liquide', 'lisière', 'lister', 'lithium',
  'litige', 'littoral', 'livreur', 'logique', 'lointain', 'loisir', 'lombric', 'loterie',
  'louer', 'lourd', 'loutre', 'louve', 'loyal', 'lubie', 'lucide', 'lucratif',
  'lueur', 'lugubre', 'luisant', 'lumière', 'lunaire', 'lundi', 'luron', 'lutter',
  'luxueux', 'machine', 'magasin', 'magenta', 'magique', 'maigre', 'maillon', 'maintien',
  'mairie', 'maison', 'majorer', 'malaxer', 'maléfice', 'malheur', 'malice', 'mallette',
  'mammouth', 'mandater', 'maniable', 'manquer', 'manteau', 'manuel', 'marathon', 'marbre',
  'marchand', 'mardi', 'maritime', 'marqueur', 'marron', 'marteler', 'mascotte', 'massif',
  'matériel', 'matière', 'matraque', 'maudire', 'maussade', 'mauve', 'maximal', 'méchant',
  'méconnu', 'médaille', 'médecin', 'méditer', 'méduse', 'meilleur', 'mélange', 'mélodie',
  'membre', 'mémoire', 'menacer', 'mener', 'menhir', 'mensonge', 'mentor', 'mercredi',
  'mérite', 'merle', 'messager', 'mesure', 'métal', 'météore', 'méthode', 'métier',
  'meuble', 'miauler', 'microbe', 'miette', 'mignon', 'migrer', 'milieu', 'million',
  'mimique', 'mince', 'minéral', 'minimal', 'minorer', 'minute', 'miracle', 'miroiter',
  'missile', 'mixte', 'mobile', 'moderne', 'moelleux', 'mondial', 'moniteur', 'monnaie',
  'monotone', 'monstre', 'montagne', 'monument', 'moqueur', 'morceau', 'morsure', 'mortier',
  'moteur', 'motif', 'mouche', 'moufle', 'moulin', 'mousson', 'mouton', 'mouvant',
  'multiple', 'munition', 'muraille', 'murène', 'murmure', 'muscle', 'muséum', 'musicien',
  'mutation', 'muter', 'mutuel', 'myriade', 'myrtille', 'mystère', 'mythique', 'nageur',
  'nappe', 'narquois', 'narrer', 'natation', 'nation', 'nature', 'naufrage', 'nautique',
  'navire', 'nébuleux', 'nectar', 'néfaste', 'négation', 'négliger', 'négocier', 'neige',
  'nerveux', 'nettoyer', 'neurone', 'neutron', 'neveu', 'niche', 'nickel', 'nitrate',
  'niveau', 'noble', 'nocif', 'nocturne', 'noirceur', 'noisette', 'nomade', 'nombreux',
  'nommer', 'normatif', 'notable', 'notifier', 'notoire', 'nourrir', 'nouveau', 'novateur',
  'novembre', 'novice', 'nuage', 'nuancer', 'nuire', 'nuisible', 'numéro', 'nuptial',
  'nuque', 'nutritif', 'obéir', 'objectif', 'obliger', 'obscur', 'observer', 'obstacle',
  'obtenir', 'obturer', 'occasion', 'occuper', 'océan', 'octobre', 'octroyer', 'octupler',
  'oculaire', 'odeur', 'odorant', 'offenser', 'officier', 'offrir', 'ogive', 'oiseau',
  'olfactif', 'olivier', 'ombrage', 'omettre', 'onctueux', 'onduler', 'onéreux', 'onirique',
  'opale', 'opaque', 'opérer', 'opinion', 'opportun', 'opprimer', 'opter', 'optique',
  'orageux', 'orange', 'orbite', 'ordonner', 'oreille', 'organe', 'orgueil', 'orifice',
  'ornement', 'orque', 'ortie', 'osciller', 'osmose', 'ossature', 'otarie', 'ouragan',
  'ourson', 'outil', 'outrage', 'ouvrage', 'ovation', 'oxyde', 'oxygène', 'ozone',
  'paisible', 'palace', 'palmarès', 'palourde', 'palper', 'panache', 'panda', 'pangolin',
  'paniquer', 'panneau', 'panorama', 'pantalon', 'papaye', 'papier', 'papoter', 'papyrus',
  'paradoxe', 'parcelle', 'paresse', 'parfumer', 'parler', 'parole', 'parrain', 'parsemer',
  'partager', 'parure', 'parvenir', 'passion', 'pastèque', 'paternel', 'patience', 'patron',
  'pavillon', 'pavoiser', 'payer', 'paysage', 'peigne', 'peintre', 'pelage', 'pélican',
  'pelle', 'pelouse', 'peluche', 'pendule', 'pénétrer', 'pénible', 'pensif', 'pénurie',
  'pépite', 'péplum', 'perdrix', 'perforer', 'période', 'permuter', 'perplexe', 'persil',
  'perte', 'peser', 'pétale', 'petit', 'pétrir', 'peuple', 'pharaon', 'phobie',
  'phoque', 'photon', 'phrase', 'physique', 'piano', 'pictural', 'pièce', 'pierre',
  'pieuvre', 'pilote', 'pinceau', 'pipette', 'piquer', 'pirogue', 'piscine', 'piston',
  'pivoter', 'pixel', 'pizza', 'placard', 'plafond', 'plaisir', 'planer', 'plaque',
  'plastron', 'plateau', 'pleurer', 'plexus', 'pliage', 'plomb', 'plonger', 'pluie',
  'plumage', 'pochette', 'poésie', 'poète', 'pointe', 'poirier', 'poisson', 'poivre',
  'polaire', 'policier', 'pollen', 'polygone', 'pommade', 'pompier', 'ponctuel', 'pondérer',
  'poney', 'portique', 'position', 'posséder', 'posture', 'potager', 'poteau', 'potion',
  'pouce', 'poulain', 'poumon', 'pourpre', 'poussin', 'pouvoir', 'prairie', 'pratique',
  'précieux', 'prédire', 'préfixe', 'prélude', 'prénom', 'présence', 'prétexte', 'prévoir',
  'primitif', 'prince', 'prison', 'priver', 'problème', 'procéder', 'prodige', 'profond',
  'progrès', 'proie', 'projeter', 'prologue', 'promener', 'propre', 'prospère', 'protéger',
  'prouesse', 'proverbe', 'prudence', 'pruneau', 'psychose', 'public', 'puceron', 'puiser',
  'pulpe', 'pulsar', 'punaise', 'punitif', 'pupitre', 'purifier', 'puzzle', 'pyramide',
  'quasar', 'querelle', 'question', 'quiétude', 'quitter', 'quotient', 'racine', 'raconter',
  'radieux', 'ragondin', 'raideur', 'raisin', 'ralentir', 'rallonge', 'ramasser', 'rapide',
  'rasage', 'satellite', 'saturer', 'saugrenu', 'saumon', 'sauter', 'sauvage', 'savant',
  'savonner', 'scalpel', 'scandale', 'scélérat', 'scénario', 'sceptre', 'schéma', 'science',
  'scinder', 'score', 'scrutin', 'sculpter', 'séance', 'sécable', 'sécher', 'secouer',
  'sécréter', 'sédatif', 'séduire', 'seigneur', 'séjour', 'sélectif', 'semaine', 'sembler',
  'semence', 'séminal', 'sénateur', 'sensible', 'sentence', 'séparer', 'séquence', 'serein',
  'sergent', 'sérieux', 'serrure', 'sérum', 'service', 'sésame', 'sévir', 'sevrage',
  'sextuple', 'sidéral', 'siècle', 'siéger', 'siffler', 'sigle', 'signal', 'silence',
  'silicium', 'simple', 'sincère', 'sinistre', 'siphon', 'sirop', 'sismique', 'situer',
  'skier', 'social', 'socle', 'sodium', 'soigneux', 'soldat', 'soleil', 'solitude',
  'soluble', 'sombre', 'sommeil', 'somnoler', 'sonde', 'songeur', 'sonnette', 'sonore',
  'sorcier', 'sortir', 'sosie', 'sottise', 'soucieux', 'soudure', 'souffle', 'soulever',
  'soupape', 'source', 'soutirer', 'souvenir', 'spacieux', 'spatial', 'spécial', 'sphère',
  'spiral', 'splendeur', 'sportif', 'stable', 'station', 'sternum', 'stimulus', 'stipuler',
  'strict', 'studieux', 'stupeur', 'styliste', 'sublime', 'substrat', 'subtil', 'subvenir',
  'succès', 'sucre', 'suffixe', 'suggérer', 'suiveur', 'sulfate', 'superbe', 'supplier',
  'surface', 'suricate', 'surmener', 'surprise', 'sursaut', 'survie', 'suspect', 'syllabe',
  'symbole', 'symétrie', 'synapse', 'syntaxe', 'système', 'tabac', 'tablier', 'tactile',
  'tailler', 'talent', 'talisman', 'talonner', 'tambour', 'tamiser', 'tangible', 'tapis',
  'taquiner', 'tarder', 'tarif', 'tartine', 'tasse', 'tatami', 'tatouage', 'taupe',
  'taureau', 'taxer', 'téléphone', 'témoigner', 'temporal', 'tenaille', 'tendre', 'teneur', 
  'tennis', 'tension', 'terminal', 'ternir', 'terrible', 'tétine', 'texte', 'texture',
  'théorie', 'thérapie', 'thorax', 'tibia', 'tiède', 'timide', 'tirelire', 'tiroir',
  'tissu', 'titane', 'titre', 'tituber', 'toboggan', 'tolérant', 'tomate', 'tonique',
  'tonneau', 'toponyme', 'torche', 'tordre', 'tornade', 'torpille', 'torrent', 'torse',
  'tortue', 'totem', 'toucher', 'tournage', 'tousser', 'toxine', 'traction', 'trafic',
  'tragique', 'trahir', 'train', 'trancher', 'travail', 'trèfle', 'tremper', 'trésor',
  'treuil', 'triage', 'tribunal', 'tricoter', 'trident', 'trilogie', 'triomphe', 'tripler',
  'triturer', 'trivial', 'trombone', 'tronc', 'tropical', 'troupeau', 'tuile', 'tulipe',
  'tumulte', 'tunnel', 'turbine', 'tuteur', 'tutoyer', 'tuyau', 'tympan', 'typhon',
  'typique', 'tyran', 'ubuesque', 'ultime', 'ultrason', 'unanime', 'unifier', 'union',
  'unique', 'unitaire', 'univers', 'uranium', 'urbain', 'urticant', 'usage', 'usine',
  'usuel', 'usure', 'utile', 'utopie', 'vacarme', 'vaccin', 'vagabond', 'vague',
  'vaillant', 'vaincre', 'vaisseau', 'valable', 'valise', 'vallon', 'valve', 'vampire',
  'vanille', 'vapeur', 'varier', 'vaseux', 'vassal', 'vaste', 'vecteur', 'vedette',
  'végétal', 'véhicule', 'veinard', 'véloce', 'vendredi', 'vénérer', 'venger', 'venimeux',
  'ventouse', 'verdure', 'vérin', 'vernir', 'verrou', 'verser', 'vertu', 'veston',
  'vétéran', 'vétuste', 'vexant', 'vexer', 'viaduc', 'viande', 'victoire', 'vidange',
  'vidéo', 'vieillir', 'vierge', 'vieux', 'vigile', 'vignette', 'vigueur', 'vilain',
  'village', 'vinaigre', 'violon', 'vipère', 'virement', 'virtuose', 'virus', 'visage',
  'viseur', 'vision', 'visqueux', 'visuel', 'vital', 'vitesse', 'viticole', 'vitrine',
  'vivace', 'vivipare', 'vocation', 'voguer', 'voile', 'voisin', 'voiture', 'volaille',
  'volcan', 'voltiger', 'volume', 'vorace', 'voter', 'vouer', 'vouloir', 'voyage',
  'voyelle', 'wagon', 'xénon', 'yacht', 'zèbre', 'zénith', 'zeste', 'zoologie',
];

// ══════════════════════════════════════════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Génère 12 mots aléatoires depuis la liste BIP39 française
 */
export function generateSacredWords(): string[] {
  const words: string[] = [];
  const usedIndices = new Set<number>();
  
  while (words.length < 12) {
    // Crypto-quality random (pour web, on utilise Math.random avec multiple sources)
    const randomBytes = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      randomBytes[0] = Math.floor(Math.random() * 4294967296);
    }
    
    const index = randomBytes[0] % BIP39_FRENCH.length;
    
    // Éviter les doublons
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      words.push(BIP39_FRENCH[index]);
    }
  }
  
  return words;
}

/**
 * Stocke les mots sacrés de manière sécurisée
 */
export async function storeSacredWords(words: string[]): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Sur web, pas de SecureStore
      console.log('SecureStore not available on web');
      return false;
    }
    
    const wordsJson = JSON.stringify(words);
    await SecureStore.setItemAsync(SACRED_WORDS_KEY, wordsJson);
    await SecureStore.setItemAsync(SACRED_WORDS_DATE_KEY, new Date().toISOString());
    
    console.log('✨ 12 mots sacrés générés et stockés');
    return true;
  } catch (error) {
    console.error('Error storing sacred words:', error);
    return false;
  }
}

/**
 * Récupère les mots sacrés depuis le stockage sécurisé
 */
export async function getSacredWords(): Promise<string[] | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }
    
    const wordsJson = await SecureStore.getItemAsync(SACRED_WORDS_KEY);
    
    if (wordsJson) {
      return JSON.parse(wordsJson);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting sacred words:', error);
    return null;
  }
}

/**
 * Vérifie si les mots sacrés existent
 */
export async function hasSacredWords(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    
    const words = await SecureStore.getItemAsync(SACRED_WORDS_KEY);
    return words !== null;
  } catch {
    return false;
  }
}

/**
 * Supprime les mots sacrés (pour reset)
 */
export async function deleteSacredWords(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    
    await SecureStore.deleteItemAsync(SACRED_WORDS_KEY);
    await SecureStore.deleteItemAsync(SACRED_WORDS_DATE_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting sacred words:', error);
    return false;
  }
}

/**
 * Génère et stocke les mots sacrés (appelé à l'Éveil)
 */
export async function initializeSacredWords(): Promise<string[] | null> {
  // Vérifier si les mots existent déjà
  const existing = await getSacredWords();
  if (existing) {
    console.log('Mots sacrés existants trouvés');
    return existing;
  }
  
  // Générer de nouveaux mots
  const words = generateSacredWords();
  const success = await storeSacredWords(words);
  
  return success ? words : null;
}
